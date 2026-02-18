# Use Node.js 20 LTS as base image
FROM node:20.19.0-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application code
COPY index.js ./
COPY sync-artworks.js ./
COPY routes ./routes
COPY utils ./utils

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
