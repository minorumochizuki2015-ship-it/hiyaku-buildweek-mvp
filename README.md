# HIKYAKU

HIKYAKU is a mobile-first Edo courier companion that turns a short everyday walk into a small mission.

## How to run locally

Assumes Node.js 20.19+ (Node 22+ recommended) and npm.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`). The static MVP uses deterministic local mock missions; select a time and energy level, then choose **Generate My Mission**. **Demo Journey** advances automatically and can also be completed with **End Mission**.

For the Worker scaffold, use `npm run worker:dev` once Wrangler is installed. It exposes `POST /api/mission` and `POST /api/complete` with validated mock responses. No Cloudflare deployment or credentials are required for this stage.
