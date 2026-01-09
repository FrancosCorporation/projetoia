FROM python:3.10-slim

WORKDIR /app

# Instala ffmpeg e as bibliotecas necessárias para o DirectML/D3D12 no Linux
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Instala o Whisper e o suporte DirectML
RUN pip install --no-cache-dir torch-directml openai-whisper fastapi uvicorn python-multipart

COPY main.py .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]