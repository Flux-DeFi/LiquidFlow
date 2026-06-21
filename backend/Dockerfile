FROM node:20-alpine AS builder

WORKDIR /app

# Install curl so the Docker healthcheck works when this stage is used directly (e.g. dev override)
RUN apk add --no-cache curl

COPY package.json package-lock.json ./
RUN npm ci --fetch-retries=5 --fetch-retry-mintimeout=10000

COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY src ./src
COPY prisma ./prisma

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install curl for the Docker healthcheck
RUN apk add --no-cache curl
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

COPY package.json package-lock.json ./
RUN npm ci --only=production --fetch-retries=5 --fetch-retry-mintimeout=10000 && npm install @prisma/client

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

CMD ["npm", "start"]
