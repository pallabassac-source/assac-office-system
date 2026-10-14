# Production Dockerfile for Backend API Service
FROM node:20-alpine

# Install system dependencies required for native Node module builds (sqlite3) and timezone data
RUN apk add --no-cache python3 make g++ tzdata

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
