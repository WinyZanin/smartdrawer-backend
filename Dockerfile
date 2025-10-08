# Dockerfile for SmartDrawer Backend

# Stage 1: Build
FROM node:20-alpine AS builder
ENV NODE_ENV=development
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app /app
#COPY .env .env
ENV NODE_ENV=production
EXPOSE 3000

# Use a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/logs && chown appuser:appgroup /app/logs
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["npm", "run", "start"]
