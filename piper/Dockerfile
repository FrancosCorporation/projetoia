FROM python:3.9-slim

# Instala dependências do sistema necessárias para áudio e processamento
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Instala o piper e o flask explicitamente
RUN pip install --no-cache-dir piper-tts flask

# Pasta para as vozes
WORKDIR /quality

# Expõe a porta do servidor
EXPOSE 5000

# O comando inicia o servidor via módulo python
ENTRYPOINT ["python3", "-m", "piper.http_server"]