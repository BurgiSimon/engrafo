FROM python:3.12-slim

# System libs needed by Docling / its OCR + image stack.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Stable cache location for the prefetched models.
ENV HF_HOME=/models

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Prefetch Docling models (layout, TableFormer, OCR) so the first conversion
# doesn't pay a slow cold-download cost at runtime.
RUN docling-tools models download

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
