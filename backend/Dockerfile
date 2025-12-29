# backend/Dockerfile

# Use an official lightweight Python image
FROM python:3.12-slim

# Set environment variables (Prevents Python from writing .pyc files)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory inside the container
WORKDIR /app

# Install system dependencies (Required for PostgreSQL)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of the application code
COPY . .

# Default command (Overridden by docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]