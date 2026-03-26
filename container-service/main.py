import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import containers, files, terminal
from services.docker_manager import DockerManager
from services.port_manager import PortManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.docker_manager = DockerManager()
    app.state.port_manager = PortManager(start_port=10000, end_port=11000)
    yield
    # Cleanup on shutdown
    pass


app = FastAPI(
    title="ClawIDE Container Service",
    version="1.0.0",
    lifespan=lifespan,
)

API_KEY = os.getenv("CONTAINER_SERVICE_API_KEY", "dev-secret-key")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    # Skip auth for docs, health, and websocket upgrades
    if request.url.path in ("/docs", "/openapi.json", "/health", "/"):
        return await call_next(request)
    if request.url.path.startswith("/ws/"):
        return await call_next(request)
    if request.url.path.startswith("/preview/"):
        return await call_next(request)

    api_key = request.headers.get("X-API-Key")
    if api_key != API_KEY:
        return JSONResponse(status_code=401, content={"detail": "Invalid API key"})

    return await call_next(request)


app.include_router(containers.router, prefix="/containers", tags=["containers"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(terminal.router, prefix="/ws", tags=["terminal"])


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"service": "ClawIDE Container Service", "version": "1.0.0"}
