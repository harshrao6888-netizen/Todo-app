# To-Do List App (MERN)

A mobile-first to-do app for creating, scheduling and tracking tasks week by week, built from the provided Figma design.

**Stack:** MongoDB · Express · React (Vite) · Node.js · Tailwind CSS

## Features

| Requirement | Where |
|---|---|
| Create task: title\*, description, date & time\*, priority (Low/Medium/High) | Round `+` button → "Add New Task" sheet |
| Edit any attribute | Pencil icon on a task, or tap a task → **Edit** |
| Delete | Swipe a task left → **Delete** (also the bin icon). Undo is offered. |
| Search by keyword (title + description), with view / edit / delete | Search bar on Home → Search screen |
| Tasks grouped by week, **Monday → Sunday** | Home → week strip and **All Weeks** cards |
| Week cards show **Open** and **Completed** counts and expand on click | Home → All Weeks |
| Mark tasks **Completed** / **In Progress**; week counts update immediately | Checkbox on each task, or the status toggle in task details |

Beyond the document: onboarding screen, Settings (gear icon) and notifications (bell icon, with unread badge) for **ended** tasks (end time passed, not completed), **starting soon** tasks (configurable lead time) and a **daily summary**, with optional browser pop-ups.

## Project structure

```
server/   Express + Mongoose REST API (tests: Vitest + Supertest + mongodb-memory-server)
client/   React + Vite + Tailwind UI   (tests: Vitest unit tests, Playwright end-to-end)
```

## API

Base path: `/api/tasks`

| Method | Path | Description |
|---|---|---|
| GET | `/api/tasks?from=&to=` | List tasks (optional ISO date range on `startAt`) |
| GET | `/api/tasks/search?q=` | Case-insensitive keyword search on title and description |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create (`title`, `startAt` required) |
| PATCH | `/api/tasks/:id` | Update any field, including `status` |
| DELETE | `/api/tasks/:id` | Delete |
| GET | `/api/health` | Health check |

Task fields: `title` (required), `description`, `startAt` (required date & time), `endAt` (optional, ≥ `startAt`), `priority` (`low` \| `medium` \| `high` \| `null`), `status` (`in_progress` \| `completed`).

Errors are returned as `{ "error": "message" }` with status 400, 404 or 500.

## Run locally

Requirements: Node 20+, and MongoDB (local or Docker).

```bash
# MongoDB in Docker (port 27018 to avoid clashing with an existing local Mongo)
docker run -d --name todo-mongo -p 27018:27017 mongo:7

# API
cd server
cp .env.example .env        # set MONGODB_URI if different
npm install
npm run dev                 # http://localhost:5000

# Web app (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

## Tests

```bash
cd server && npm test          # API tests (in-memory MongoDB)
cd client && npm test          # week grouping + notification logic
cd client && npm run test:e2e  # Playwright, phone viewport; needs MongoDB on :27018
```

## Deploy

**Database: MongoDB Atlas.** Create a free M0 cluster and a database user, allow network access from `0.0.0.0/0`, and copy the connection string (add `/todo-app` before the `?`).

**API: Render.** New → Blueprint, then select this repo; `render.yaml` configures it. Set environment variables:
- `MONGODB_URI`: the Atlas connection string
- `CORS_ORIGIN`: your Netlify URL, e.g. `https://your-app.netlify.app`

**Web: Netlify.** Import the repo; `netlify.toml` sets base `client`, build `npm run build`, and publish `dist`. Set the environment variable:
- `VITE_API_URL`: your Render URL, e.g. `https://todo-api.onrender.com`

Note: Render's free tier sleeps after inactivity, so the first request can take around 30 seconds.
