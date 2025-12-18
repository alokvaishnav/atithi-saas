# Use the official Python image (Lightweight version)
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install system tools needed for PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]