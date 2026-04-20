# Born 3D Deployment Guide

Deploy the app as a single Render web service.

## Render service

Create one Render Web Service from `cloud-backend`:

- Name: `born3d-play`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/play`

That service serves:

- `/play`
- `/game`
- `/api/*`

The frontend uses the same origin for login and game data, so there is no separate backend host to configure.

## Webador embed

Use this iframe on `www.othman-creativity.com/play`:

```html
<iframe
  src="https://born3d-play.onrender.com/play"
  style="width:100%;height:900px;border:0;border-radius:16px;overflow:hidden;"
  allow="fullscreen; autoplay"
></iframe>
```

## Test

After deploy, open:

- `https://born3d-play.onrender.com/play`
- `https://born3d-play.onrender.com/api/chat`
