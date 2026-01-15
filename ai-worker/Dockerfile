FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run the worker
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD find /tmp/worker_health -mmin -2 || exit 1

CMD ["python", "main.py"]
