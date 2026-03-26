# ClawIDE

A multi-user, multi-tenant cloud IDE for internal organization use. Built with Next.js, FastAPI, Docker, and MongoDB.

## Architecture

- **Web App**: Next.js 14 (App Router) + Monaco Editor + xterm.js
- **Auth**: Clerk (multi-tenant with organizations)
- **Container Service**: FastAPI managing Docker containers per workspace
- **Database**: MongoDB
- **UI**: Tailwind CSS + shadcn/ui

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- A [Clerk](https://clerk.com) account (for auth)

### 1. Clone and configure

```bash
git clone <repo-url>
cd claw-ide
cp web/.env.example web/.env
```

Edit `web/.env` with your Clerk keys and MongoDB URI.

### 2. Build workspace images

```bash
docker build -t clawide-node ./workspace-images/node
docker build -t clawide-python ./workspace-images/python
```

### 3. Start with Docker Compose

```bash
docker-compose up --build
```

This starts:
- **Web app** at http://localhost:3000
- **Container service** at http://localhost:8000
- **MongoDB** at localhost:27017

### 4. Local development (without Docker for web)

```bash
# Terminal 1: Start MongoDB and container service
docker-compose up mongo container-service

# Terminal 2: Start the web app in dev mode
cd web
npm install
npm run dev
```

## Project Structure

```
claw-ide/
├── web/                          # Next.js app
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── dashboard/        # Project management
│   │   │   ├── workspace/        # IDE view
│   │   │   ├── sign-in/          # Clerk auth
│   │   │   └── api/              # API routes
│   │   ├── components/           # React components
│   │   │   ├── editor/           # Monaco, file explorer, tabs
│   │   │   ├── terminal/         # xterm.js terminal
│   │   │   └── preview/          # App preview iframe
│   │   └── lib/                  # DB, models, API client
│   └── ...
├── container-service/            # FastAPI service
│   ├── main.py                   # App entry
│   ├── routers/                  # API endpoints
│   └── services/                 # Docker & port management
├── workspace-images/             # Docker images for workspaces
│   ├── node/Dockerfile
│   └── python/Dockerfile
└── docker-compose.yml
```

## Features

- **Multi-tenant auth** with Clerk organizations
- **Full IDE** with Monaco editor, file explorer, and tabs
- **Integrated terminal** via xterm.js + WebSocket
- **Live preview** with port forwarding
- **Project templates**: Next.js, Python/FastAPI, Blank
- **Container isolation**: each workspace runs in its own Docker container
- **Auto-save** with 1-second debounce
- **File operations**: create, rename, delete files and folders
- **Resource limits**: CPU and memory limits per container

## API Endpoints

### Web API (Next.js)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List projects for org |
| POST | `/api/projects` | Create project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/workspace` | Get workspace |
| POST | `/api/projects/:id/workspace` | Create/start workspace |

### Container Service (FastAPI)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/containers/create` | Create container |
| POST | `/containers/:id/start` | Start container |
| POST | `/containers/:id/stop` | Stop container |
| DELETE | `/containers/:id` | Delete container |
| POST | `/containers/:id/exec` | Execute command |
| GET | `/files/:id/tree` | List files |
| GET | `/files/:id/read` | Read file |
| PUT | `/files/:id/write` | Write file |
| DELETE | `/files/:id/delete` | Delete file |
| WS | `/ws/terminal/:id` | Terminal WebSocket |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `MONGODB_URI` | MongoDB connection string |
| `NEXT_PUBLIC_CONTAINER_SERVICE_URL` | Container service URL |
| `CONTAINER_SERVICE_API_KEY` | API key for container service |
| `DOCKER_HOST` | Docker socket path |

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Terminal**: xterm.js (@xterm/xterm)
- **Backend**: FastAPI, Docker SDK for Python
- **Database**: MongoDB + Mongoose
- **Auth**: Clerk
- **Container Runtime**: Docker
