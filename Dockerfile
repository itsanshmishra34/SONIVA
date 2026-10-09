# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S soniva -u 1001 -G nodejs

# Copy built assets and production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/tsconfig.json ./

# Ensure data directory exists for durable storage mounting
RUN mkdir -p /app/data && chown -R soniva:nodejs /app/data

USER soniva

EXPOSE 3000

CMD ["node", "--import", "tsx/esm", "server.ts"]
