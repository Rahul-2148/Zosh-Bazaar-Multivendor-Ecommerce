FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/base.txt requirements/ml.txt ./requirements/

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements/base.txt -r requirements/ml.txt

# Final runtime image
FROM python:3.12-slim

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000 \
    ENVIRONMENT=production

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "ai.apps.main:app", "--host", "0.0.0.0", "--port", "8000"]
