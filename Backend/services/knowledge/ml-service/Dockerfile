# Baalvion ML service — slim multi-stage build.
# Pinned to 3.12: numpy/scipy/scikit-learn/statsmodels/psycopg2-binary all ship
# prebuilt wheels for it. 3.14 has none yet, so pip falls back to compiling every
# one of them from source (extremely slow, and psycopg2-binary's source build
# additionally needs pg_config/libpq-dev, which this image never installed).
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    MODEL_DIR=/var/lib/baalvion/models

WORKDIR /app

# Build deps for numpy/scipy/scikit-learn/statsmodels wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Non-root + writable model dir.
RUN useradd -m -u 10001 mluser \
    && mkdir -p ${MODEL_DIR} \
    && chown -R mluser:mluser ${MODEL_DIR} /app
USER mluser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/healthz').status==200 else 1)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
