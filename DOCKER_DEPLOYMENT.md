# TestGen Frontend - Docker Deployment Guide

This guide provides instructions for deploying the TestGen frontend using Docker.

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose (optional, for orchestration)
- Backend API accessible

## Quick Start

### 1. Build the Docker Image

```bash
docker build -t testgen-fe:latest .
```

### 2. Run the Container

#### Basic Run (Development)
```bash
docker run -d \
  --name testgen-frontend \
  -p 3000:80 \
  testgen-fe:latest
```

The application will be available at: `http://localhost:3000`

#### Run with Custom Backend API
```bash
docker run -d \
  --name testgen-frontend \
  -p 3000:80 \
  -e VITE_API_HOST=http://your-backend-api:8080 \
  testgen-fe:latest
```

**Note:** Environment variables must be set at build time for Vite applications. See "Build-time Configuration" section below.

## Configuration

### Build-time Configuration

Since Vite bundles environment variables at build time, you need to configure the backend API before building:

1. **Update `.env` file:**
   ```bash
   VITE_API_HOST=http://your-backend-api:8080
   VITE_APP_NAME=TestGen
   VITE_APP_VERSION=0.2.0
   VITE_API_TIMEOUT=30000
   ```

2. **Build with custom configuration:**
   ```bash
   docker build \
     --build-arg VITE_API_HOST=http://your-backend-api:8080 \
     -t testgen-fe:latest .
   ```

### Runtime Configuration

The nginx server listens on port 80 inside the container. Map it to any port on your host:

```bash
docker run -d -p 8080:80 testgen-fe:latest  # Access on port 8080
docker run -d -p 3000:80 testgen-fe:latest  # Access on port 3000
```

## Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    container_name: testgen-frontend
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - testgen-network

  # Optional: Include backend service
  backend:
    image: testgen-backend:latest
    container_name: testgen-backend
    ports:
      - "8080:8080"
    restart: unless-stopped
    networks:
      - testgen-network

networks:
  testgen-network:
    driver: bridge
```

Run with Docker Compose:
```bash
docker-compose up -d
```

## Common Commands

### View Logs
```bash
docker logs testgen-frontend
docker logs -f testgen-frontend  # Follow logs
```

### Stop Container
```bash
docker stop testgen-frontend
```

### Remove Container
```bash
docker rm testgen-frontend
```

### Restart Container
```bash
docker restart testgen-frontend
```

### Execute Commands Inside Container
```bash
docker exec -it testgen-frontend sh
```

### Remove Image
```bash
docker rmi testgen-fe:latest
```

## Production Deployment

### 1. Multi-stage Build Optimization

The Dockerfile uses multi-stage builds:
- **Build stage**: Compiles the application using Node.js
- **Production stage**: Serves static files using lightweight Nginx Alpine

This results in a small, efficient image (~25MB).

### 2. Health Checks

Add health check to your container:

```bash
docker run -d \
  --name testgen-frontend \
  -p 3000:80 \
  --health-cmd="wget --quiet --tries=1 --spider http://localhost/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  testgen-fe:latest
```

Check health status:
```bash
docker inspect --format='{{.State.Health.Status}}' testgen-frontend
```

### 3. Security Considerations

The nginx configuration includes:
- **Gzip compression** for faster loading
- **Security headers** (X-Frame-Options, X-Content-Type-Options, etc.)
- **Asset caching** for static files
- **Health check endpoint** at `/health`

### 4. Resource Limits

Limit container resources:

```bash
docker run -d \
  --name testgen-frontend \
  -p 3000:80 \
  --memory="256m" \
  --cpus="0.5" \
  testgen-fe:latest
```

## Cloud Deployment

### AWS ECS/Fargate

1. Push image to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag testgen-fe:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/testgen-fe:latest

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/testgen-fe:latest
```

2. Create ECS task definition with the image

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/testgen-fe

# Deploy to Cloud Run
gcloud run deploy testgen-frontend \
  --image gcr.io/PROJECT_ID/testgen-fe \
  --platform managed \
  --port 80 \
  --allow-unauthenticated
```

### Azure Container Instances

```bash
# Push to ACR
az acr build --registry <registry-name> --image testgen-fe:latest .

# Deploy to ACI
az container create \
  --resource-group myResourceGroup \
  --name testgen-frontend \
  --image <registry-name>.azurecr.io/testgen-fe:latest \
  --dns-name-label testgen-fe \
  --ports 80
```

### Kubernetes

Create deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: testgen-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: testgen-frontend
  template:
    metadata:
      labels:
        app: testgen-frontend
    spec:
      containers:
      - name: frontend
        image: testgen-fe:latest
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: testgen-frontend
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: testgen-frontend
```

Apply:
```bash
kubectl apply -f k8s-deployment.yaml
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs testgen-frontend

# Inspect container
docker inspect testgen-frontend
```

### Application not accessible
```bash
# Verify container is running
docker ps

# Check port mapping
docker port testgen-frontend

# Test inside container
docker exec -it testgen-frontend wget -O- http://localhost/health
```

### Build fails
```bash
# Clean build cache
docker builder prune

# Build without cache
docker build --no-cache -t testgen-fe:latest .
```

### API connection issues
1. Check `.env` file has correct `VITE_API_HOST`
2. Rebuild the image after changing `.env`
3. Ensure backend API is accessible from container
4. Check CORS settings on backend

## Monitoring

### Container Stats
```bash
docker stats testgen-frontend
```

### Nginx Access Logs
```bash
docker logs testgen-frontend | grep -v "GET /health"
```

## Cleanup

Remove all related containers and images:

```bash
# Stop and remove container
docker stop testgen-frontend && docker rm testgen-frontend

# Remove image
docker rmi testgen-fe:latest

# Clean up unused resources
docker system prune -a
```

## Support

For issues or questions:
1. Check the logs: `docker logs testgen-frontend`
2. Verify environment configuration in `.env`
3. Ensure backend API is running and accessible
4. Review nginx configuration in `nginx.conf`

## License

MIT License
