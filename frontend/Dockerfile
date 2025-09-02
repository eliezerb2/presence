# Simple static file server using busybox
FROM busybox:latest

# Create directory for static files
WORKDIR /app

# Copy built React app
COPY build/ .

# Expose port 80
EXPOSE 80

# Use busybox httpd to serve static files
CMD ["busybox", "httpd", "-f", "-v", "-p", "80", "-h", "/app"]
