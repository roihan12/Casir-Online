FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

RUN npx puppeteer browsers install chrome

COPY . .
RUN npx prisma generate

FROM node:18-alpine

WORKDIR /app
# Copy files with proper ownership
COPY --chown=node:node --from=builder /app ./

ENV NODE_ENV=production

# Switch to non-root user
USER node

EXPOSE 3000
CMD ["node", "server.js"]