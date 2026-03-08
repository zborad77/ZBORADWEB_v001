(() => {
  function buildOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Zavrit galerii">&times;</button>
      <button type="button" class="lightbox-nav lightbox-prev" aria-label="Predchozi fotka">&#10094;</button>
      <img class="lightbox-image" alt="">
      <button type="button" class="lightbox-nav lightbox-next" aria-label="Dalsi fotka">&#10095;</button>
      <div class="lightbox-counter" aria-live="polite"></div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  function initGallery(gallery) {
    const images = Array.from(gallery.querySelectorAll("img"));
    if (!images.length) return;

    const overlay = buildOverlay();
    const imageEl = overlay.querySelector(".lightbox-image");
    const closeEl = overlay.querySelector(".lightbox-close");
    const prevEl = overlay.querySelector(".lightbox-prev");
    const nextEl = overlay.querySelector(".lightbox-next");
    const counterEl = overlay.querySelector(".lightbox-counter");

    let currentIndex = 0;
    function render(index) {
      currentIndex = (index + images.length) % images.length;
      const source = images[currentIndex];
      imageEl.src = source.src;
      imageEl.alt = source.alt || "";
      counterEl.textContent = `${currentIndex + 1} / ${images.length}`;
    }

    function open(index) {
      render(index);
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
    }

    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
      imageEl.src = "";
    }

    function next() {
      render(currentIndex + 1);
    }

    function prev() {
      render(currentIndex - 1);
    }

    images.forEach((img, index) => {
      img.classList.add("is-lightbox-item");
      img.setAttribute("role", "button");
      img.setAttribute("tabindex", "0");

      img.addEventListener("click", () => open(index));
      img.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(index);
        }
      });
    });

    closeEl.addEventListener("click", close);
    nextEl.addEventListener("click", next);
    prevEl.addEventListener("click", prev);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("is-open")) return;

      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const galleries = document.querySelectorAll(".reference-gallery");
    galleries.forEach((gallery) => initGallery(gallery));
  });
})();
