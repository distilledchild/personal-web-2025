# Use Node.js 20 LTS as base image
FROM node:20.19.0-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY index.js ./

# Copy service account key if it exists (for GCS access)
# Note: In production, prefer using GCP service account binding instead
COPY service-account-key.json* ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
