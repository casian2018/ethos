FROM python:3.10-slim

WORKDIR /app

RUN pip install --no-cache-dir livekit-agents livekit-plugins-gemini

COPY . .

CMD ["python", "main.py"]
