# SONIVA — Deployment Guide

## Prerequisites
- Node.js 22+ LTS or Docker.
- Firebase project configured with Firestore and Authentication.

## Environment Variables
- `NODE_ENV`: `production`
- `PORT`: `3000`
- `FIREBASE_PROJECT_ID`: `civil-experience-12sm5`
- `FIRESTORE_DATABASE_ID`: `ai-studio-soniva-6a7f2593-e8ec-4be8-84e2-12cf01c9d665`

## Docker Build & Run
```bash
docker build -t soniva:latest .
docker run -p 3000:3000 -e NODE_ENV=production soniva:latest
```

## Kubernetes Deployment
Apply manifests in `/k8s`:
```bash
kubectl apply -f k8s/
```
