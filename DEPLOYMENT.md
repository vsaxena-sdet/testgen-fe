# TestGen Frontend - Deployment Guide

## Overview

The TestGen frontend is a vanilla JavaScript application that connects to the TestGen backend API. It's separated from the backend to allow independent deployment and scaling.

## Project Structure

```
testgen-fe/
├── public/
│   └── index.html          # Main HTML file
├── src/
│   ├── main.js             # Main application logic
│   ├── styles.css          # Styling
│   └── config.js           # Environment configuration
├── scripts/
├── .env                    # Local environment config (git-ignored)
├── .env.example            # Environment template
├── vite.config.js          # Vite build configuration
├── package.json            # Project dependencies and scripts
└── DEPLOYMENT.md           # This file
```

## Prerequisites

- Node.js 16+ or Python 3.7+
- Access to the TestGen backend API

## Setup & Development

### 1. Install Dependencies

Using npm:
```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the API host:

```bash
cp .env.example .env
```

Edit `.env` with your backend API host:

```env
VITE_API_HOST=http://localhost:9091  # Local development
# or
VITE_API_HOST=https://api-staging.example.com  # Staging
# or
VITE_API_HOST=https://api.example.com  # Production
```

### 3. Development Server

Run the development server with hot reload:

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### 4. Build for Production

Create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment Options

### Option 1: Using Vite Preview (Development/Testing)

```bash
npm run serve:dev
```

This serves the frontend at `http://localhost:3000`

### Option 2: Using Python HTTP Server (Simple Static Hosting)

```bash
# First, build the project
npm run build

# Then serve the dist directory
npm run serve:prod
```

The application will be available at `http://localhost:3000`

### Option 3: Using Node.js Server

Create a simple Node server (`server.js`):

```javascript
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'dist', req.url);
  
  if (req.url === '/' || req.url === '') {
    filePath = path.join(__dirname, 'dist', 'index.html');
  }
  
  if (path.extname(filePath) === '') {
    filePath = path.join(__dirname, 'dist', 'index.html');
  }
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    
    const ext = path.extname(filePath).slice(1);
    const contentType = {
      'html': 'text/html',
      'js': 'application/javascript',
      'css': 'text/css',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    }[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`TestGen Frontend listening on http://localhost:${PORT}`);
});
```

Run with:
```bash
npm run build
node server.js
```

### Option 4: Docker Deployment

Create a `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t testgen-fe:latest .
docker run -p 3000:3000 \
  -e VITE_API_HOST=http://backend-api:9091 \
  testgen-fe:latest
```

### Option 5: Cloud Platforms

#### Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variable: `VITE_API_HOST=https://api.example.com`

#### Vercel

1. Push code to GitHub
2. Import project into Vercel
3. Set framework preset: `Vite`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variable: `VITE_API_HOST=https://api.example.com`

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Environment Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_HOST` | `http://localhost:9091` | Backend API server URL |
| `VITE_APP_NAME` | `TestGen` | Application name |
| `VITE_APP_VERSION` | `0.2.0` | Application version |
| `VITE_API_TIMEOUT` | `30000` | API request timeout in ms |

### Configuration for Different Environments

#### Local Development (`.env`)
```env
VITE_API_HOST=http://localhost:9091
VITE_APP_NAME=TestGen
VITE_APP_VERSION=0.2.0
VITE_API_TIMEOUT=30000
```

#### Staging (`.env.staging`)
```env
VITE_API_HOST=https://staging-api.testgen.example.com
VITE_APP_NAME=TestGen Staging
VITE_APP_VERSION=0.2.0-rc
VITE_API_TIMEOUT=30000
```

#### Production (`.env.production`)
```env
VITE_API_HOST=https://api.testgen.example.com
VITE_APP_NAME=TestGen
VITE_APP_VERSION=0.2.0
VITE_API_TIMEOUT=30000
```

## CORS Configuration

If frontend and backend are on different domains, ensure CORS is enabled on the backend:

```python
# In testgen-openai backend (api/app.py)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://fe.example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Building & Packaging

### Development Build
```bash
npm run build  # Builds for production (minified)
```

### Preview Build
```bash
npm run preview  # Preview production build locally
```

### Source Maps (Optional)

For debugging in production, enable source maps in `vite.config.js`:

```javascript
build: {
  sourcemap: true,  // Enable source maps
}
```

## Performance Optimization

### Recommended Settings

1. **Enable Gzip compression** on your web server:
   - nginx: `gzip on;`
   - Apache: Enable `mod_deflate`

2. **Cache static assets** with long expiration:
   - HTML: 0 seconds (no-cache)
   - CSS/JS: 1 year (cache buster via hash)
   - Images: 1 month

3. **Content Delivery Network (CDN)**:
   - Use CloudFront, Cloudflare, or similar
   - Distributes static files globally

4. **Asset Optimization**:
   - Minification: Enabled by default in Vite
   - Tree-shaking: Removes unused code
   - Code splitting: Already configured in vite.config.js

## Troubleshooting

### Frontend can't connect to backend

1. Check `VITE_API_HOST` is correct
2. Verify backend is running
3. Check CORS configuration on backend
4. Check browser console for detailed errors
5. Verify API endpoints match (`/upload`, `/generate`, etc.)

### Build errors

```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Slow performance

1. Check production build is being served (not dev build)
2. Enable gzip compression
3. Use CDN for static files
4. Optimize images
5. Check backend API response times

## Monitoring & Logging

### Browser Console

Logs are available in browser console:
- Configuration loaded on page load
- API call errors and responses
- Form validation and generation progress

### Backend API Logs

Monitor backend logs for:
- API endpoint requests
- File upload and processing
- Test case generation duration
- Error messages

## Support & Updates

For issues or updates:
1. Check the [TestGen GitHub repository](https://github.com/your-org/testgen)
2. Review backend API documentation
3. Check environment configuration

## License

MIT License - See LICENSE file
