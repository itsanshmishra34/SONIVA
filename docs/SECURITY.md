# SONIVA — Security & Compliance

## Authentication & Authorization
- Firebase ID token verification via Firebase Admin SDK (`verifyIdToken`).
- Strict server-side role-based access control (RBAC) and account isolation.
- No client-supplied UIDs trusted without server verification.

## Rate Limiting & Abuse Prevention
- Tiered sliding-window rate limiting for Auth, Search, Chat, and General APIs.
- HTTP 429 responses with `Retry-After` headers.
- WebSocket message rate and connection concurrency controls.

## Privacy & Data Protection
- Zero-PII storage outside of required account authentication profile fields.
- Firestore Security Rules configured with zero-trust validation helpers (`isValidId`, `isValidUser`, etc.).
- Secure headers and CORS allowlists.
