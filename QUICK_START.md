# TestGen Frontend - Quick Start

## Setup (5 minutes)

### 1. Install Node Dependencies
```bash
cd /Users/vaibhavsaxena/IdeaProjects/testgen-fe
npm install
```

### 2. Configure Backend URL
```bash
# Already created with default:
cat .env
# Shows: VITE_API_HOST=http://localhost:9091

# Change if needed:
nano .env
```

### 3. Start Development Server
```bash
npm run dev
```

Opens at `http://localhost:5173`

---

## Backend Setup (Separate)

### Terminal 1: Start Backend
```bash
cd /Users/vaibhavsaxena/Desktop/testgen-openai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn testgen_min.app:app --host 0.0.0.0 --port 9091 --reload
```

Backend available at `http://localhost:9091`

---

## Testing

### Browser Console Check
```javascript
// Open DevTools (F12)
// Console tab should show:
// 🔧 Frontend Configuration:
//    API Host: http://localhost:9091
//    API Timeout: 30000ms
//    App: TestGen v0.2.0
```

### Test Upload
1. Use file browser or drag-drop
2. Select a .txt, .pdf, or .docx file
3. Should upload and process in background

### Test Generation
1. Select LLM model
2. Add or use uploaded file
3. Click "Generate Test Cases"
4. View results

---

## Build for Production

```bash
# Build
npm run build

# Output in dist/
# Ready to deploy to:
# - Netlify
# - Vercel
# - S3
# - Your own server
```

---

## Environment Variables

### Development
```env
VITE_API_HOST=http://localhost:9091
```

### Staging
```env
VITE_API_HOST=https://staging-api.testgen.example.com
```

### Production
```env
VITE_API_HOST=https://api.testgen.example.com
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on API calls | Check `VITE_API_HOST` in `.env` |
| Backend not found | Start backend on port 9091 |
| CORS error | Verify backend CORS is enabled |
| Build fails | `npm install` and try again |
| Module not found | Delete `node_modules` and reinstall |

---

## Quick Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run serve:prod   # Serve with Python HTTP server
```

---

## Full Deployment Guide

See `DEPLOYMENT.md` for comprehensive setup including:
- Docker deployment
- Cloud platform setup (Netlify, Vercel, AWS)
- Performance optimization
- CORS configuration
- Monitoring
