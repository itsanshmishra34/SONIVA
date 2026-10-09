# SONIVA — Build Plan

## Phases & Milestones
- **Phase 0: Workspace Audit & Planning** (Completed): Inspected repository structure, existing features, backend code (`server.ts`), music player, 3D canvas, and test suite.
- **Phase 1: Application Foundation** (Completed): React SPA, Vite, Tailwind CSS, responsive shell, Lucide icons, Liquid Glass design system, theme presets (Aurora Night, Sunset Lounge, Pure Black), error boundaries.
- **Phase 2: Authentication & Onboarding** (Completed): Firebase Auth integration, ID token verification, session restoration, onboarding wizard.
- **Phase 3: Backend & Database Foundation** (Completed): Express server, Firestore Admin SDK integration, robust storage health checks, Zod validation, rate limiting, structured logging, `/api/health`, `/api/ready`, `/api/metrics`.
- **Phase 4: Music Foundation** (Completed): Normalized track model, Audius/SoundCloud/YouTube provider adapters, centralized `AudioManager`, persistent global player, queue management.
- **Phase 5: Chat & Social Features** (Completed): 1:1 and room chat, WebSocket real-time sync, message deduplication, presence, blocking & reporting.
- **Phase 6: Rooms & Matching** (Completed): Random Connect (music-aware matching), private Vibe Rooms (access codes), Listen Together synchronized playback.
- **Phase 7: Audio Communication** (Completed): Audio-only Sing Together and voice call architecture, microphone consent flow, connection lifecycle.
- **Phase 8: Feedback & Admin** (Completed): Rate App, Suggest Feature, server-authorized admin moderation dashboard.
- **Phase 9: 3D, Animation & Polish** (Completed): Three.js floating musical sculpture (`SonivaUniverse3DCanvas`), Aurora lighting, glass-depth transitions, responsive mobile adaptation.
- **Phase 10: Infrastructure & Release Readiness** (Completed): Hardened Dockerfile, `.dockerignore`, Kubernetes manifests (`k8s/`), CI/CD workflows, and comprehensive regression test suite (34/34 tests passing).
