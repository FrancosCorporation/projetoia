FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
RUN mkdir -p /data/memorias && chown -R node:node /data
ENV NODE_ENV=production MEMORY_DIR=/data/memorias
VOLUME ["/data"]
USER node
CMD ["node", "index.js"]
