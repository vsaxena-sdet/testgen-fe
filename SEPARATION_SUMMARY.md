# TestGen Project Separation Summary

## Overview

The TestGen project has been successfully separated into two independent projects:

1. **Backend API:** `/Users/vaibhavsaxena/Desktop/testgen-openai`
2. **Frontend:** `/Users/vaibhavsaxena/IdeaProjects/testgen-fe`

This separation allows for independent development, deployment, and scaling.

## What Changed

### Backend (testgen-openai)

✅ **Changes Made:**
- Removed `testgen_min/static/` directory
- Updated `testgen_min/app.py` to remove static file serving
- Added CORS middleware for cross-origin requests
- Updated to serve API only (pure REST API)

✅ **Files Modified:**
- `testgen_min/app.py`: Removed static mounting, added CORSMiddleware
- Removed imports: `HTMLResponse`, `StaticFiles`

✅ **Result:**
- Backend now serves ONLY REST API endpoints
- Frontend can be served independently
- Full separation of concerns

### Frontend (testgen-fe)

✅ **New Structure:**
```
testgen-fe/
├── public/
│   └── index.html
├── src/
│   ├── main.js          # Updated with config import
│   ├── styles.css
│   └── config.js        # NEW: Environment configuration
├── .env                 # NEW: Local development config
├── .env.example         # NEW: Environment template
├── package.json         # NEW: Build and serve scripts
├── vite.config.js       # NEW: Vite build configuration
└── DEPLOYMENT.md        # NEW: Comprehensive deployment guide
```

✅ **Changes Made:**
- Import environment configuration via `config.js`
- All API calls updated to use `API` constant from config
- Environment variables for API host and settings
- Proper ES6 module structure

✅ **API Calls Updated:**
- `/upload` → `API.upload` (uses VITE_API_HOST)
- `/generate` → `API.generate`
- `/testcases` → `API.testcases`
- `/export/excel` → `API.exportExcel`
- `/statistics` → `API.statistics`
- `/llm-models` → `API.llmModels`

## Environment Configuration

### Frontend (.env)

```env
# Backend API Configuration
VITE_API_HOST=http://localhost:9091

# App Settings
VITE_APP_NAME=TestGen
VITE_APP_VERSION=0.2.0
VITE_API_TIMEOUT=30000
```

**Supported Environments:**
- Local development: `http://localhost:9091`
- Staging: `https://staging-api.testgen.example.com`
- Production: `https://api.testgen.example.com`

### Backend Configuration

No changes needed. Backend continues to use `.env` for:
- OpenAI API credentials
- File upload directories
- LLM model settings
- Logging configuration

## Running Both Projects

### Option 1: Local Development (Same Machine)

**Terminal 1 - Backend:**
```bash
cd /Users/vaibhavsaxena/Desktop/testgen-openai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn testgen_min.app:app --host 0.0.0.0 --port 9091 --reload
```

**Terminal 2 - Frontend:**
```bash
cd /Users/vaibhavsaxena/IdeaProjects/testgen-fe
npm install
npm run dev
```

Frontend will open at `http://localhost:5173`
Backend API available at `http://localhost:9091`

### Option 2: Docker Deployment

**Backend Container:**
```bash
cd /Users/vaibhavsaxena/Desktop/testgen-openai
docker build -t testgen-backend:latest .
docker run -p 9091:9091 \
  -e OPENAI_API_KEY=your-key \
  -v testgen-data:/app/data \
  testgen-backend:latest
```

**Frontend Container:**
```bash
cd /Users/vaibhavsaxena/IdeaProjects/testgen-fe
docker build -t testgen-fe:latest .
docker run -p 3000:3000 \
  -e VITE_API_HOST=http://backend:9091 \
  testgen-fe:latest
```

### Option 3: Production Deployment

**Frontend:**
```bash
cd testgen-fe
npm install
npm run build
# Serve dist/ with nginx, S3, Netlify, or Vercel
```

**Backend:**
```bash
cd testgen-openai
pip install gunicorn
gunicorn testgen_min.app:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:9091
```

## CORS Configuration

### Current Setup (Allows All Origins)
```python
# testgen_min/app.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Open - only for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Recommended for Production
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fe.example.com",
        "https://www.example.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
```

## File Organization

### Backend Project

```
testgen-openai/
├── testgen_min/
│   ├── core/           # Models & Config
│   ├── llm/            # LLM Providers
│   ├── rag/            # RAG System
│   ├── api/            # API Endpoints (future)
│   ├── prompt/         # Prompts
│   ├── validation/     # QA
│   └── utils/          # Logging & Storage
├── app.py              # Main FastAPI app (will move to api/)
├── requirements.txt    # Python dependencies
├── BACKEND_README.md   # Backend documentation
└── Dockerfile          # Backend container
```

### Frontend Project

```
testgen-fe/
├── public/
│   └── index.html      # Main HTML file
├── src/
│   ├── main.js         # App logic (updated)
│   ├── config.js       # NEW: Environment config
│   └── styles.css      # Styles
├── .env                # Local environment
├── .env.example        # Environment template
├── package.json        # Dependencies & scripts
├── vite.config.js      # Build configuration
├── DEPLOYMENT.md       # Frontend deployment guide
└── Dockerfile          # Frontend container
```

## API Endpoints

All endpoints on backend remain the same:

```
GET  /healthz                  # Health check
GET  /llm-models              # Available models
POST /upload                  # Upload file
POST /generate                # Generate test cases
GET  /testcases              # Get test cases
GET  /statistics             # Get statistics
GET  /export/excel           # Export as Excel
```

No changes to request/response formats.

## Development Workflow

### Making Changes

**To update backend:**
```bash
cd testgen-openai
# Make changes to testgen_min/
git add .
git commit -m "Backend: ..."
```

**To update frontend:**
```bash
cd ../testgen-fe
# Make changes to src/
git add .
git commit -m "Frontend: ..."
```

### Testing Integration

1. Start backend server
2. Update `testgen-fe/.env` with backend URL
3. Start frontend dev server
4. Test API calls via browser console

### Debugging

**Frontend issues:**
- Check browser console (F12)
- Check `.env` for correct API_HOST
- Verify network tab for API calls

**Backend issues:**
- Check server logs for errors
- Verify CORS configuration
- Test API endpoints with curl/Postman

## Migration Path

### From Old Structure (Static Serving)

Old way:
```bash
# Frontend served from backend at /
curl http://localhost:9091/
# API at same origin
curl http://localhost:9091/upload
```

New way:
```bash
# Frontend served independently
http://localhost:5173/  # Frontend dev server

# API from different origin
http://localhost:9091/upload  # Backend API
```

### Environment Variables

**Old:** Frontend was hardcoded to call `localhost:9091`

**New:** Configure via `.env`:
```env
VITE_API_HOST=http://localhost:9091  # Dev
VITE_API_HOST=https://api.example.com  # Prod
```

## Deployment Strategies

### Strategy 1: CDN + Serverless

- Frontend: Deploy to Netlify/Vercel
- Backend: Deploy to AWS Lambda/Google Cloud Run
- Benefits: Auto-scaling, global CDN, low cost

### Strategy 2: Docker Compose

- Both services in Docker
- Single docker-compose.yml
- Easy local testing and staging

### Strategy 3: Kubernetes

- Frontend service
- Backend service
- Ingress for routing
- Benefits: Enterprise-grade, auto-scaling

### Strategy 4: Traditional VPS

- Frontend: nginx static server
- Backend: Python/Gunicorn server
- Benefits: Simple, predictable, low cost

## Checklist

### Before Deploying

- [ ] Backend `.env` configured with API keys
- [ ] Frontend `.env.production` configured with API_HOST
- [ ] CORS configured for your domain
- [ ] SSL/TLS certificates installed
- [ ] Backend health check passing
- [ ] Frontend can reach API endpoints
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place
- [ ] Error handling tested
- [ ] Load testing completed

### Security

- [ ] API keys never committed to git
- [ ] CORS restricted to known domains
- [ ] Rate limiting enabled
- [ ] Input validation on backend
- [ ] Sensitive data not in logs
- [ ] HTTPS enforced
- [ ] CSRF protection if needed

## Support & Documentation

**Backend:** `/Users/vaibhavsaxena/Desktop/testgen-openai/BACKEND_README.md`
**Frontend:** `/Users/vaibhavsaxena/IdeaProjects/testgen-fe/DEPLOYMENT.md`
**Project Refactoring:** `/Users/vaibhavsaxena/Desktop/testgen-openai/REFACTORING.md`

## Next Steps

1. **Backend Testing:**
   - Run health check: `GET /healthz`
   - Test file upload: `POST /upload`
   - Test generation: `POST /generate`

2. **Frontend Testing:**
   - Run: `npm run dev`
   - Verify config loads: Check browser console
   - Test API calls in browser

3. **Integration Testing:**
   - Upload a file
   - Generate test cases
   - Verify results

4. **Deployment:**
   - Choose deployment strategy
   - Set up CI/CD
   - Deploy to staging
   - Deploy to production

## Questions?

For specific issues, check:
- Backend errors: Check server logs
- Frontend errors: Check browser console
- Network issues: Check browser Network tab
- Configuration: Verify `.env` files
- CORS issues: Check backend middleware

Refer to respective README files for detailed information.
