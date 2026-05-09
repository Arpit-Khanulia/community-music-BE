# Community Music Backend

## Project Overview
- **Type**: Node.js Express API
- **Purpose**: Music downloader API using yt-dlp
- **URL**: https://community-music-be-production.up.railway.app

## Tech Stack
- Node.js 18
- Express 4
- yt-dlp for downloading

## Key Files
- `src/index.js` - Server entry point
- `src/controllers/download.controller.js` - Download logic
- `src/routes/download.routes.js` - API routes
- `Dockerfile` - Railway deployment
- `railway.json` - Railway config

## API Endpoints
- `POST /api/download` - Start download
- `GET /api/download/:id/status` - Get status
- `GET /api/downloads` - List all
- `DELETE /api/downloads/:id` - Delete
- `GET /api/download/:id/file` - Download file

## Commands
```bash
npm run dev    # Development
npm start     # Production
```

## Deployment
- Dockerfile-based deployment on Railway
- Python + yt-dlp installed in container
- Downloads stored in ephemeral filesystem (lost on restart)