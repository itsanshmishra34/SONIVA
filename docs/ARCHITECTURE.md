# SONIVA — Architecture Overview

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Three.js / React Three Fiber, Framer Motion / Motion, Lucide React.
- **Backend:** Node.js, Express, TypeScript, WebSocket (`ws`), Firebase Admin SDK.
- **Database & Auth:** Cloud Firestore, Firebase Authentication.
- **Deployment:** Docker (`node:22-alpine`), Cloud Run, Kubernetes manifests.

## Core Modules
- `server.ts`: Unified Express and WebSocket server with middleware, rate limiting, and observability.
- `src/services/`: Client and server adapters for Audius, SoundCloud, YouTube, and Firebase.
- `src/context/`: Global application state (`AuthContext`, `MusicContext`, `ThemeContext`).
- `src/components/ui/`: Liquid Glass design system and `SonivaUniverse3DCanvas` 3D visual centerpiece.
