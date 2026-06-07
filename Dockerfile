# Use official Node.js LTS image for building
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY . .

# Build the frontend assets
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy built assets and runtime dependencies from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Expose the port (Render will provide $PORT, default 4000)
EXPOSE 4000

# Start the Express server
CMD ["node", "server.js"]
