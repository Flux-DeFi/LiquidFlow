FROM node:25-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY src ./src
COPY prisma ./prisma

RUN npx prisma generate
RUN npm run build

FROM node:25-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm install @prisma/client

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["npm", "start"]
