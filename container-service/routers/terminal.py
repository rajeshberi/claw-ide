import asyncio
import struct

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


@router.websocket("/terminal/{container_id}")
async def terminal_websocket(websocket: WebSocket, container_id: str):
    await websocket.accept()

    docker_mgr = websocket.app.state.docker_manager

    try:
        exec_id, socket = docker_mgr.create_exec_interactive(container_id)
    except ValueError as e:
        await websocket.send_text(f"\r\nError: {str(e)}\r\n")
        await websocket.close()
        return

    raw_socket = socket._sock

    async def read_from_container():
        """Read output from the Docker container and send to WebSocket."""
        loop = asyncio.get_event_loop()
        try:
            while True:
                data = await loop.run_in_executor(None, lambda: raw_socket.recv(4096))
                if not data:
                    break
                # Docker stream protocol: first 8 bytes are header in non-tty mode
                # In TTY mode, raw bytes are sent directly
                try:
                    text = data.decode("utf-8", errors="replace")
                    await websocket.send_text(text)
                except Exception:
                    break
        except Exception:
            pass

    async def write_to_container():
        """Read input from WebSocket and send to Docker container."""
        try:
            while True:
                data = await websocket.receive_text()
                raw_socket.sendall(data.encode("utf-8"))
        except WebSocketDisconnect:
            pass
        except Exception:
            pass

    # Run both tasks concurrently
    read_task = asyncio.create_task(read_from_container())
    write_task = asyncio.create_task(write_to_container())

    try:
        await asyncio.gather(read_task, write_task, return_exceptions=True)
    finally:
        raw_socket.close()
        try:
            await websocket.close()
        except Exception:
            pass
