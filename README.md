# The Byte Stop

A small electronics e-commerce app (React + FastAPI + MongoDB) used as a live demo vehicle for a Datadog RUM presentation. Auth is intentionally minimal (email/password only, no third-party providers), and the checkout endpoint deliberately simulates payment latency and a ~50% failure rate so there's real, reproducible frontend/backend activity for RUM to catch on stage.

## Prerequisites

- Python 3.11+ (tested on 3.14)
- Node 22 (use the provided `.nvmrc`: `nvm use` from `frontend/`; Node 21 hits a known npm optional-dependency bug with Vite 8's bundled `rolldown` binaries)
- MongoDB Community running locally on the default port (`mongodb://localhost:27017`)

## Running with Docker (recommended)

`docker-compose up --build` starts all four pieces — Mongo, backend, frontend, and a **personal** Datadog Agent — without touching anything on the host. This is the easiest way to run the whole stack, and the only way to get APM traces into *your own* Datadog org if, like on a Datadog-issued laptop, `/opt/datadog-agent` is centrally managed by IT with a corporate API key you don't control.

```bash
cp .env.example .env   # then fill in your own DD_API_KEY (Organization Settings > API Keys)
docker-compose up --build
```

- App: http://localhost:5173 — Backend: http://localhost:8000/docs
- The personal Agent's trace receiver is mapped to host port **8127**, not 8126 — deliberately, so it can never collide with a corporate host Agent that's already using 8126. The backend talks to it internally over the Compose network (`datadog-agent:8126`), so this only matters if you want to hit the Agent directly from the host.
- Backend logs are structured JSON to stdout; the Agent container collects them automatically from all containers (`DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true`) — no per-service log config needed, unlike the bare-metal setup below.
- `backend/.env` and `frontend/.env` are reused as-is (via `env_file`) — only `MONGODB_URI`, `DD_AGENT_HOST`, and `DD_TRACE_AGENT_PORT` are overridden for the container network, everything else (JWT secret, RUM/Logs credentials, etc.) comes from the same files the bare-metal setup below uses.
- Mongo's data lives in its own Docker volume, separate from any native `mongod` on the host — no port conflict, no shared state with the bare-metal workflow.

## Bare-metal setup (alternative to Docker)

Useful if you don't want Docker running during the actual presentation, or want to use the host's existing Datadog Agent instead of a containerized one.

### Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # defaults are fine for local MongoDB
set -a && source .env && set +a   # DD_* vars must be in the shell env before ddtrace-run starts
ddtrace-run uvicorn app.main:app --reload --port 8000
```

`ddtrace-run` reads `DD_SERVICE`/`DD_ENV`/`DD_LOGS_INJECTION`/`DD_TRACE_SAMPLE_RATE` at process startup — before `main.py`'s own `load_dotenv()` call ever runs — so they need to already be in the shell environment (the `source .env` step above), not just in the `.env` file. Traces go to whatever Datadog Agent is listening on `localhost:8126` (check with `/opt/datadog-agent/bin/agent/agent status` if unsure one's running).

- API docs: http://localhost:8000/docs
- On first startup, the `products` collection is seeded with ~11 electronics items if empty. Each product's image is a real, verified-matching stock photo (not a placeholder) served from `frontend/public/images/` — no external image host, so the catalog renders correctly with no network dependency.
- Health check: `GET /api/health`
- Structured JSON logs (with `dd.trace_id`/`dd.span_id` correlation fields) are written to `backend/logs/app.log`. A local Datadog Agent conf.d entry (`the_byte_stop.d/conf.yaml`) tails that file if one's running on this machine.

### Frontend setup

```bash
cd frontend
nvm use            # switches to Node 22 per .nvmrc
npm install
cp .env.example .env   # points VITE_API_BASE_URL at http://localhost:8000
npm run dev
```

- App: http://localhost:5173

### Stopping the bare-metal servers

- If running in the foreground (the normal case), just `Ctrl+C` in each terminal.
- If a server was started in the background (e.g. via `nohup ... &`) and you don't have that terminal, kill whatever is bound to the port instead:
  ```bash
  lsof -ti:8000 | xargs kill -9   # backend
  lsof -ti:5173 | xargs kill -9   # frontend
  ```
- For the Docker stack instead, just `docker-compose down` (add `-v` to also drop the Mongo volume).

## Trying it out

1. Browse the electronics catalog on `/`, add a few items to the cart.
2. Try checking out while logged out — you'll be redirected to `/login`.
3. Sign up (`/signup`), then checkout — the order either succeeds or hits the simulated "payment processor timeout" (~1 in 2 attempts, ~1.5s latency either way).
4. Try `/forgot-password` — this is a demo stub: no email is sent, the reset token is shown directly in the UI and links straight to `/reset-password/:token`.

## What's deliberately stubbed

- No real payment processor — checkout is simulated.
- No email delivery — password reset returns the token directly instead of emailing it.

## Datadog instrumentation

- **Frontend (RUM + Browser Logs)**: wired in `frontend/src/main.tsx` via `datadogRum.init()` / `datadogLogs.init()`. Reads `VITE_DATADOG_APPLICATION_ID` / `VITE_DATADOG_CLIENT_TOKEN` from `frontend/.env` — leave them blank to run without Datadog (a console warning notes this, the app still works). `allowedTracingUrls` is set to `localhost:8000` so RUM requests carry trace headers the backend can pick up.
- **Backend (APM traces + logs)**: run with `ddtrace-run` (see Backend setup above) to auto-instrument FastAPI/Starlette and pymongo — no code changes needed for basic spans. Structured JSON logs go to `backend/logs/app.log` with `dd.trace_id`/`dd.span_id` injected (via `DD_LOGS_INJECTION=true`), so a failing checkout's trace and its log line correlate in Datadog.
  - **Bare-metal**: needs a Datadog Agent running locally with APM enabled (`localhost:8126`) and, for log tailing, the conf.d entry at `/opt/datadog-agent/etc/conf.d/the_byte_stop.d/conf.yaml`. On a corporate/IT-managed machine, that Agent's API key may belong to a different org than the one your RUM application lives in — traces will deliver successfully but be invisible in the org you're checking. See "Running with Docker" above for the fix.
  - **Docker**: no setup needed beyond `DD_API_KEY` in the root `.env` — the personal Agent container handles both traces and log collection automatically.

## Troubleshooting

- **`bad interpreter: .../venv/bin/python3: no such file or directory`** — the project folder was moved or renamed after the venv was created. Python venvs hardcode absolute paths into every script under `venv/bin/`, so they don't survive a move. Fix: `rm -rf backend/venv` and recreate it (`python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`) from the new location. If `npm run dev` breaks the same way after a move, the fix is the same idea: `rm -rf node_modules package-lock.json && npm install`.
- **`Address already in use` on port 8000** — a previous `uvicorn` process (e.g. from before a folder move) is still bound to the port. Find and kill it: `lsof -ti:8000 | xargs kill -9`.
