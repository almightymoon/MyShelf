# Athar's Shelf API — build context is the repo root
FROM node:22-alpine
WORKDIR /app

COPY server/package.json ./
RUN npm install --omit=dev

COPY server/src ./src
COPY server/sql ./sql

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "src/index.js"]
