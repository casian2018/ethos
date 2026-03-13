# Using Python 3.11-slim as a base image
FROM python:3.11-slim

# Install system dependencies required for OpenCV and other libraries
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip and install Python packages
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir \
    livekit-agents \
    livekit-plugins-google \
    ultralytics \
    opencv-python-headless \
    numpy

COPY . .

# Command to run the main script
CMD ["python", "main.py"]
