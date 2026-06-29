"""Thin wrapper around Docling's DocumentConverter.

Converters are expensive to build (they load ML models), so we cache one per
combination of pipeline toggles and reuse it across requests.
"""

from __future__ import annotations

import threading
from functools import lru_cache
from pathlib import Path
from typing import Any

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, RapidOcrOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling_core.types.doc import ImageRefMode

# Output formats this app exposes (kept in sync with the frontend OptionsPanel).
SUPPORTED_OUTPUT_FORMATS = ["markdown", "json"]

# Input extensions Docling can ingest. Surfaced to the UI via /api/formats so the
# dropzone can advertise what it accepts.
SUPPORTED_INPUT_EXTENSIONS = [
    ".pdf",
    ".docx",
    ".xlsx",
    ".pptx",
    ".html",
    ".htm",
    ".xhtml",
    ".md",
    ".markdown",
    ".csv",
    ".adoc",
    ".asciidoc",
    ".png",
    ".jpg",
    ".jpeg",
    ".tif",
    ".tiff",
    ".bmp",
    ".webp",
]

# Building a converter is not guaranteed thread-safe; guard the cache.
_cache_lock = threading.Lock()


@lru_cache(maxsize=None)
def _build_converter(
    do_ocr: bool, do_tables: bool, gen_images: bool
) -> DocumentConverter:
    opts = PdfPipelineOptions()
    opts.do_ocr = do_ocr
    opts.do_table_structure = do_tables
    # Pin RapidOCR to its ONNX Runtime backend. RapidOCR is Docling's bundled
    # default engine, but if onnxruntime isn't importable it silently falls back
    # to a PyTorch backend that lacks the PP-OCR model URLs and raises
    # "Unsupported configuration: torch.PP-OCRv6.det.small". Being explicit keeps
    # OCR (and image inputs, which always require OCR) working deterministically.
    opts.ocr_options = RapidOcrOptions(backend="onnxruntime")
    if gen_images:
        opts.generate_picture_images = True
        opts.images_scale = 2.0
    return DocumentConverter(
        format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=opts)}
    )


def get_converter(do_ocr: bool, do_tables: bool, gen_images: bool) -> DocumentConverter:
    with _cache_lock:
        return _build_converter(do_ocr, do_tables, gen_images)


def convert_file(
    path: Path,
    formats: list[str],
    do_ocr: bool,
    do_tables: bool,
    gen_images: bool,
) -> dict[str, Any]:
    """Convert a single file and export the requested formats.

    Returns a mapping of format name -> exported content (str for markdown,
    dict for the lossless JSON DoclingDocument).
    """
    converter = get_converter(do_ocr, do_tables, gen_images)
    result = converter.convert(str(path))
    doc = result.document

    outputs: dict[str, Any] = {}
    if "markdown" in formats:
        # EMBEDDED inlines figures as base64 so the downloaded .md is self-contained.
        image_mode = ImageRefMode.EMBEDDED if gen_images else ImageRefMode.PLACEHOLDER
        outputs["markdown"] = doc.export_to_markdown(image_mode=image_mode)
    if "json" in formats:
        outputs["json"] = doc.export_to_dict()
    return outputs
