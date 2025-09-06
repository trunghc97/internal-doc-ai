# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source code
COPY . .

# Set browserslist environment variable
ENV BROWSERSLIST="> 0.5%, last 2 versions, not dead, Chrome >= 90, Firefox >= 88, Safari >= 14, Edge >= 90, iOS >= 14, Android >= 8"

# Build the application
RUN npm run build --prod

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
