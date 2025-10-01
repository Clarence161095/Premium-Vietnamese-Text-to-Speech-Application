# Multi-stage build
FROM node:18-slim AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Python stage with Node.js
FROM python:3.9-slim

# Install system dependencies including CUDA-compatible tools
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    git \
    wget \
    espeak \
    espeak-data \
    libespeak-dev \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built Next.js app from frontend-builder
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/next.config.ts ./
COPY --from=frontend-builder /app/node_modules ./node_modules

# Copy source files
COPY src ./src
COPY voices ./voices

# Install Python dependencies
WORKDIR /app/src/zipvoice
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Verify numpy installation
RUN python3 -c "import numpy; print('Numpy installed successfully:', numpy.__version__)"

# Create necessary directories
WORKDIR /app
RUN mkdir -p uploads output public/soundeffect

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONPATH=/app/src/zipvoice
ENV PYTHON_PATH=/usr/bin/python3

# Start command
CMD ["npm", "start"]
