# Reference template workflow

This does not modify any existing page. It only generates a new reference HTML file.

## 1) Prepare data JSON

Copy:

- `tools/reference-data.example.json`

to e.g.:

- `tools/reference-data.new.json`

Fill values:

- `title`
- `description`
- `images` (array of relative image paths)
- `output` (target html file path)

## 2) Generate page

Run in project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\generate-reference.ps1 -DataFile .\tools\reference-data.new.json
```

## 3) Upload via FTP

Upload:

- generated `.html` file
- new images

Then add the link manually into your reference list page where needed.
