# Agrisentry AI Deployment Guide

## 1. Backend (Cloud: Render/AWS)
- Set Environment Variables for Weather API and Database.
- Run `uvicorn main:app --host 0.0.0.0 --port 8000`.

## 2. Frontend (Cloud: Vercel)
- Set `REACT_APP_API_URL` to your backend endpoint.
- Deploy as a PWA for offline support.

## 3. Database
- Use MongoDB Atlas for scalable agricultural data storage.
