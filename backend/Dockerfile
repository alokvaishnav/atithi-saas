FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (for PDF generation & DB)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code
COPY . .

# Run the app
CMD ["gunicorn", "atithi_api.wsgi:application", "--bind", "0.0.0.0:8000"]
