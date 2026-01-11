FROM python:3.9-slim

# Instala dependências de áudio
RUN apt-get update && apt-get install -y \
    libsndfile1 curl \
    && rm -rf /var/lib/apt/lists/*

# Instala o piper e o flask
RUN pip install --no-cache-dir piper-tts flask

# Define a pasta de trabalho
WORKDIR /quality

EXPOSE 5000

# O entrypoint chama o servidor interno do piper
ENTRYPOINT ["python3", "-m", "piper.http_server"]