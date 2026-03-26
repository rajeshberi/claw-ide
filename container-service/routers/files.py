from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class WriteFileRequest(BaseModel):
    path: str
    content: str


class RenameRequest(BaseModel):
    old_path: str
    new_path: str


class CreateDirRequest(BaseModel):
    path: str


@router.get("/{container_id}/read")
async def read_file(container_id: str, path: str, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        content = docker_mgr.read_file(container_id, path)
        return {"path": path, "content": content}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{container_id}/write")
async def write_file(container_id: str, req: WriteFileRequest, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        return docker_mgr.write_file(container_id, req.path, req.content)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{container_id}/tree")
async def list_files(container_id: str, request: Request, path: str = "/home/coder/project"):
    try:
        docker_mgr = request.app.state.docker_manager
        files = docker_mgr.list_files(container_id, path)
        return {"files": files}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{container_id}/delete")
async def delete_file(container_id: str, path: str, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        return docker_mgr.delete_file(container_id, path)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{container_id}/rename")
async def rename_file(container_id: str, req: RenameRequest, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        return docker_mgr.rename_file(container_id, req.old_path, req.new_path)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{container_id}/mkdir")
async def create_directory(container_id: str, req: CreateDirRequest, request: Request):
    try:
        docker_mgr = request.app.state.docker_manager
        return docker_mgr.create_directory(container_id, req.path)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
