# Born 3D Deployment Guide

Deploy the play site and backend as separate Render web services.

---

## 1. Frontend service

Create a Render Web Service from the repo root:

- Name: `born3d-play`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/play`

This serves the game at `/play` through `script/local-server.js`.

---

## 2. Backend service

Create a second Render Web Service from `cloud-backend`:

- Name: `born3d-backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/`

Required environment variables:

```bash
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_key
PORT=10000
```

---

## 3. Frontend-to-backend link

The frontend already points at the backend host used by the game. If you need to override it manually, use:

```html
https://born3d-play.onrender.com/play?backend=https://born3d-backend.onrender.com
```

---

## 4. Webador embed

Use this iframe on `www.othman-creativity.com/play`:

```html
<iframe
  src="https://born3d-play.onrender.com/play?backend=https://born3d-backend.onrender.com"
  style="width:100%;height:900px;border:0;border-radius:16px;overflow:hidden;"
  allow="fullscreen; autoplay"
></iframe>
```

---

## 5. Test

After both services are live, open:

- `https://born3d-play.onrender.com/play`
- `https://born3d-backend.onrender.com`

If login still fails, check the backend service logs and confirm `MONGODB_URI` is set correctly.