FROM python:3.11-slim

# Set working directory
WORKDIR /app

    # Install system dependencies
    RUN apt-get update && apt-get install -y \
        gcc \
        g++ \
        libgdal-dev \
        gdal-bin \
        libgeos-dev \
        libproj-dev \
        libspatialindex-dev \
        postgresql-client \
        curl \
        && rm -rf /var/lib/apt/lists/*

# Set GDAL environment variables
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create scripts directory if it doesn't exist
RUN mkdir -p /app/scripts

# Copy migration script
COPY scripts/run_migrations.py /app/scripts/run_migrations.py
RUN chmod +x /app/scripts/run_migrations.py

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Use entrypoint script (runs migrations then starts app)
ENTRYPOINT ["/app/entrypoint.sh"]

