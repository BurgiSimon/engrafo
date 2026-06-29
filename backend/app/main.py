"""FastAPI app exposing the Docling file converter."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from .converter import (
    SUPPORTED_INPUT_EXTENSIONS,
    SUPPORTED_OUTPUT_FORMATS,
    convert_file,
)

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "50"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

app = FastAPI(title="Docling File Converter")


def _parse_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/formats")
def formats() -> dict[str, list[str]]:
    return {
        "input_extensions": SUPPORTED_INPUT_EXTENSIONS,
        "output_formats": SUPPORTED_OUTPUT_FORMATS,
    }


@app.post("/api/convert")
async def convert(
    file: UploadFile,
    formats: str = Form(...),
    ocr: str = Form("false"),
    tables: str = Form("true"),
    images: str = Form("false"),
) -> JSONResponse:
    requested = [f.strip() for f in formats.split(",") if f.strip()]
    requested = [f for f in requested if f in SUPPORTED_OUTPUT_FORMATS]
    if not requested:
        return JSONResponse(
            status_code=422,
            content={"error": "No valid output format selected."},
        )

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in SUPPORTED_INPUT_EXTENSIONS:
        return JSONResponse(
            status_code=422,
            content={"error": f"Unsupported input type: {suffix or 'unknown'}"},
        )

    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        return JSONResponse(
            status_code=422,
            content={"error": f"File exceeds {MAX_UPLOAD_MB} MB limit."},
        )

    tmp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            tmp_path = Path(tmp.name)

        outputs = await run_in_threadpool(
            convert_file,
            tmp_path,
            requested,
            _parse_bool(ocr),
            _parse_bool(tables),
            _parse_bool(images),
        )
    except Exception as exc:  # noqa: BLE001 - surface any conversion error to the UI
        return JSONResponse(status_code=422, content={"error": str(exc)})
    finally:
        if tmp_path is not None:
            tmp_path.unlink(missing_ok=True)

    return JSONResponse(content={"filename": file.filename, "outputs": outputs})
