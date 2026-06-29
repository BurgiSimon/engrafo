# engrafo

A clean, minimalistic web app for converting documents with
[Docling](https://docling-project.github.io/docling/). Drag in one or more files,
pick your output format(s), and download the results — Markdown or lossless JSON.

## Features

- **Drag & drop** multiple files (or click to browse).
- **Output formats:** Markdown and lossless JSON (the full `DoclingDocument`).
- **Processing toggles:**
  - **OCR** — extract text from scanned PDFs and images (EasyOCR).
  - **Table structure** — recognize rows/columns/headers with TableFormer.
  - **Export figures** — embed figures inline (base64) in the Markdown output.
- **Live per-file status** (`queued → converting → done / failed`) with isolated
  error handling — one bad file doesn't abort the batch.
- **Download all as ZIP** — bundled client-side, no server-side temp storage.

### Supported input formats

PDF, DOCX, XLSX, PPTX, HTML, Markdown, CSV, AsciiDoc, and images
(PNG, JPG, TIFF, BMP, WEBP).

## Quickstart

```bash
docker compose up --build
```

Then open **http://localhost:8080**.

> **First build note:** the backend image prefetches Docling's ML models
> (layout, TableFormer, OCR — a few hundred MB), so the initial
> `docker compose build` takes a few minutes and produces a larger image. Models
> are cached in a named volume (`models`) so they aren't re-downloaded.

## Architecture

Two containers wired together by `docker-compose.yml`:

- **`backend/`** — FastAPI + Docling. Exposes `POST /api/convert` (one file per
  request), `GET /api/formats`, and `GET /healthz`. Converters are cached per
  option-combination so models load once.
- **`frontend/`** — React + Vite SPA served by nginx, which also reverse-proxies
  `/api/*` to the backend (so there's no CORS).

The browser fires one request per file with limited concurrency, which is what
produces the live per-file status and keeps the backend stateless.

## Configuration

| Env var (backend) | Default | Description                      |
| ----------------- | ------- | -------------------------------- |
| `MAX_UPLOAD_MB`   | `50`    | Max upload size per file.        |
| `HF_HOME`         | `/models` | Model cache location.          |

## Local development

```bash
# backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000

# frontend (in another terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5173, proxies /api to :8000
```
