FROM node:18

# Dependências de sistema (Essenciais para áudio)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala as dependências do Bot
COPY ./bot/package*.json ./
RUN npm install

# Copia o código do bot
COPY ./bot .

# --- TRATAMENTO DO PIPER ---
# Copia a pasta piper que está na raiz do projeto (PROJETOIA/piper)
COPY ./piper ./piper_temp

# 1. Cria a pasta final do modelo
# 2. Se o arquivo 'piper' existir, move para a pasta de comandos do sistema e dá permissão
# 3. Move os modelos .onnx para a pasta correta
RUN mkdir -p /app/piper && \
    if [ -f "./piper_temp/piper" ]; then \
        mv ./piper_temp/piper /usr/local/bin/piper && \
        chmod +x /usr/local/bin/piper; \
    fi && \
    mv ./piper_temp/*.onnx* /app/piper/ 2>/dev/null || true && \
    rm -rf ./piper_temp

# CRIA AS PASTAS DE MEMÓRIA E DÁ PERMISSÃO
RUN mkdir -p /app/memorias /app/output && chmod -R 777 /app/memorias /app/output

CMD ["node", "index.js"]