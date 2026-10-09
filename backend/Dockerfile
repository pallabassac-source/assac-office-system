# Production Dockerfile for Backend API Service
FROM node:20-bookworm-slim

# Install system dependencies required for native Node module builds (sqlite3) and timezone data
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Ensure persistent directories exist
RUN mkdir -p /app/data /app/uploads /app/seeds

# Install production dependencies first (layer caching)
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy application source code (including seeds)
COPY . .

# Default environment configuration
ENV NODE_ENV=production \
    PORT=5000 \
    TZ=Asia/Kolkata \
    DB_DIR=/app/data \
    UPLOADS_DIR=/app/uploads

EXPOSE 5000

CMD ["node", "server.js"]
