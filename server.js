const path = require("path");
const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const TARGET_EMAIL = process.env.TARGET_EMAIL || "info@zborad.cz";

const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain"
]);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error(`Nepodporovany typ souboru: ${file.originalname}`));
  }
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function validateInput(body) {
  const jmeno = normalizeText(body.jmeno);
  const email = normalizeText(body.email);
  const telefon = normalizeText(body.telefon);
  const lokalita = normalizeText(body.lokalita);
  const typPrace = normalizeText(body.typ_prace);
  const popis = normalizeText(body.popis);
  const website = normalizeText(body.website);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (website) {
    return { ok: false, message: "Spam ochrana." };
  }
  if (!jmeno || !email || !telefon || !popis) {
    return { ok: false, message: "Vyplnte vsechna povinna pole." };
  }
  if (!emailPattern.test(email)) {
    return { ok: false, message: "Neplatny e-mail." };
  }

  return {
    ok: true,
    data: { jmeno, email, telefon, lokalita, typPrace, popis }
  };
}

app.use(express.static(path.join(__dirname)));

app.post("/api/poptavka", upload.array("prilohy", MAX_FILES), async (req, res) => {
  try {
    const validation = validateInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ ok: false, message: validation.message });
    }

    const { jmeno, email, telefon, lokalita, typPrace, popis } = validation.data;
    const files = Array.isArray(req.files) ? req.files : [];
    const safeFiles = files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    }));

    const htmlAdmin = `
      <h2>Nova nezavazna poptavka</h2>
      <p><strong>Jmeno:</strong> ${escapeHtml(jmeno)}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
      <p><strong>Telefon:</strong> ${escapeHtml(telefon)}</p>
      <p><strong>Lokalita / objekt:</strong> ${escapeHtml(lokalita || "-")}</p>
      <p><strong>Typ prace:</strong> ${escapeHtml(typPrace || "-")}</p>
      <p><strong>Popis:</strong><br>${escapeHtml(popis).replaceAll("\n", "<br>")}</p>
      <p><strong>Pocet priloh:</strong> ${safeFiles.length}</p>
    `;

    const htmlClient = `
      <h2>Potvrzeni prijeti poptavky</h2>
      <p>Dekuji, vase poptavka byla prijata.</p>
      <p><strong>Jmeno:</strong> ${escapeHtml(jmeno)}</p>
      <p><strong>Telefon:</strong> ${escapeHtml(telefon)}</p>
      <p><strong>Typ prace:</strong> ${escapeHtml(typPrace || "-")}</p>
      <p><strong>Popis:</strong><br>${escapeHtml(popis).replaceAll("\n", "<br>")}</p>
      <p>Brzy se vam ozveme.</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: TARGET_EMAIL,
      replyTo: email,
      subject: `Nova poptavka: ${jmeno}`,
      html: htmlAdmin,
      attachments: safeFiles
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      replyTo: TARGET_EMAIL,
      subject: "Potvrzeni prijeti poptavky | ZBORAD",
      html: htmlClient
    });

    return res.json({
      ok: true,
      message: "Poptavka byla odeslana. Kopie prisla na vas e-mail."
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Odeslani se nepodarilo. Zkuste to prosim znovu."
    });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ ok: false, message: "Soubor je moc velky (max 10 MB)." });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ ok: false, message: `Muzete nahrat max ${MAX_FILES} souboru.` });
    }
  }
  if (error) {
    return res.status(400).json({ ok: false, message: error.message || "Neplatna data." });
  }
  return next();
});

app.listen(PORT, () => {
  console.log(`Server bezi na http://localhost:${PORT}`);
});
