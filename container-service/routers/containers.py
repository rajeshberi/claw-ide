from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class CreateContainerRequest(BaseModel):
    workspace_id: str
    template: str = "blank"
    runtime: str = "node"
    cpu_limit: float = 0.5
    memory_limit: str = "256m"


class RunCommandRequest(BaseModel):
    command: str
    workdir: str = "/home/coder/project"


@router.post("/create")
async def create_container(req: CreateContainerRequest, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        port_mgr = request.app.state.port_manager

        host_port = port_mgr.allocate(req.workspace_id)

        result = docker_mgr.create_container(
            workspace_id=req.workspace_id,
            template=req.template,
            runtime=req.runtime,
            cpu_limit=req.cpu_limit,
            memory_limit=req.memory_limit,
            host_port=host_port,
        )
        result["port"] = host_port
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{container_id}/start")
async def start_container(container_id: str, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        return docker_mgr.start_container(container_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{container_id}/stop")
async def stop_container(container_id: str, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        return docker_mgr.stop_container(container_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{container_id}")
async def delete_container(container_id: str, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        return docker_mgr.delete_container(container_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{container_id}/status")
async def container_status(container_id: str, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        return docker_mgr.get_container_status(container_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{container_id}/exec")
async def exec_command(container_id: str, req: RunCommandRequest, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        return docker_mgr.exec_command(container_id, req.command, req.workdir)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
