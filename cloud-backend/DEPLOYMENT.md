# Born 3D Backend Deployment Guide

This guide will help you deploy your backend server to the cloud (Render, Railway, or Heroku) and connect your frontend.

---

## 1. Prepare Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_key
PORT=4000
```

- For MongoDB Atlas, create a free cluster at https://www.mongodb.com/cloud/atlas and get your connection string.
- Set a strong JWT_SECRET (any random string).

---

## 2. Deploy to Render (Recommended)

1. Go to https://render.com/ and sign up.
2. Click "New +" → "Web Service".
3. Connect your GitHub repo or upload your code.
4. Set the root directory to `cloud-backend`.
5. Set the build command: `npm install`
6. Set the start command: `npm start`
7. Add environment variables from your `.env` file.
8. Click "Create Web Service".

Your backend will be live at a public URL (e.g., `https://born3d-backend.onrender.com`).

---

## 3. Alternative: Railway or Heroku

- Railway: https://railway.app/
- Heroku: https://heroku.com/

Both support Node.js and MongoDB. Use similar steps as above.

---

## 4. Test Your API

After deployment, test your API endpoints (e.g., `/api/register`, `/api/login`, `/api/save-character`, `/api/load-character`) using Postman or curl.

---

## 5. Connect Frontend

Update your frontend code to use the deployed backend URL for all API requests.

---

## 6. Need Help?

Let me know if you want step-by-step help for a specific platform or have questions about connecting your frontend.
