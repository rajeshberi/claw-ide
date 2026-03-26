import asyncio
import io
import tarfile
from typing import Optional

import docker
from docker.errors import NotFound, APIError


WORKSPACE_IMAGES = {
    "node": "clawide-node",
    "python": "clawide-python",
}

TEMPLATE_COMMANDS = {
    "nextjs": {
        "init": "npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias '@/*' --use-npm --yes",
        "run": "npm run dev -- --hostname 0.0.0.0 --port 3000",
        "port": 3000,
    },
    "python-fastapi": {
        "init": """cat > main.py << 'PYEOF'
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from ClawIDE!"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
PYEOF
cat > requirements.txt << 'REQEOF'
fastapi
uvicorn
REQEOF""",
        "run": "uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
        "port": 8000,
    },
    "blank": {
        "init": "echo 'Welcome to ClawIDE' > README.md",
        "run": "",
        "port": 0,
    },
}


class DockerManager:
    def __init__(self):
        self.client = docker.from_env()

    def create_container(
        self,
        workspace_id: str,
        template: str = "blank",
        runtime: str = "node",
        cpu_limit: float = 0.5,
        memory_limit: str = "256m",
        host_port: Optional[int] = None,
    ) -> dict:
        image = WORKSPACE_IMAGES.get(runtime, "clawide-node")
        template_config = TEMPLATE_COMMANDS.get(template, TEMPLATE_COMMANDS["blank"])
        container_port = template_config.get("port", 0)

        port_bindings = {}
        exposed_ports = {}
        if host_port and container_port:
            port_bindings[f"{container_port}/tcp"] = [{"HostPort": str(host_port)}]
            exposed_ports[f"{container_port}/tcp"] = {}

        try:
            container = self.client.containers.run(
                image=image,
                name=f"clawide-{workspace_id}",
                detach=True,
                stdin_open=True,
                tty=True,
                working_dir="/home/coder/project",
                user="coder",
                labels={
                    "clawide": "true",
                    "clawide.workspace_id": workspace_id,
                    "clawide.template": template,
                },
                mem_limit=memory_limit,
                nano_cpus=int(cpu_limit * 1e9),
                ports=port_bindings if port_bindings else None,
                network_mode="bridge",
                command="sleep infinity",
            )

            # Initialize template
            init_cmd = template_config.get("init", "")
            if init_cmd:
                container.exec_run(
                    cmd=["bash", "-c", init_cmd],
                    user="coder",
                    workdir="/home/coder/project",
                )

            return {
                "container_id": container.id,
                "short_id": container.short_id,
                "name": container.name,
                "status": "running",
            }
        except APIError as e:
            raise RuntimeError(f"Failed to create container: {e}")

    def start_container(self, container_id: str) -> dict:
        try:
            container = self.client.containers.get(container_id)
            container.start()
            return {"status": "running"}
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def stop_container(self, container_id: str) -> dict:
        try:
            container = self.client.containers.get(container_id)
            container.stop(timeout=10)
            return {"status": "stopped"}
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def delete_container(self, container_id: str) -> dict:
        try:
            container = self.client.containers.get(container_id)
            container.remove(force=True)
            return {"status": "deleted"}
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def get_container_status(self, container_id: str) -> dict:
        try:
            container = self.client.containers.get(container_id)
            return {
                "container_id": container.id,
                "short_id": container.short_id,
                "name": container.name,
                "status": container.status,
            }
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def exec_command(self, container_id: str, command: str, workdir: str = "/home/coder/project") -> dict:
        try:
            container = self.client.containers.get(container_id)
            exit_code, output = container.exec_run(
                cmd=["bash", "-c", command],
                user="coder",
                workdir=workdir,
            )
            return {
                "exit_code": exit_code,
                "output": output.decode("utf-8", errors="replace"),
            }
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def read_file(self, container_id: str, file_path: str) -> str:
        try:
            container = self.client.containers.get(container_id)
            bits, _ = container.get_archive(file_path)
            stream = io.BytesIO()
            for chunk in bits:
                stream.write(chunk)
            stream.seek(0)
            with tarfile.open(fileobj=stream) as tar:
                for member in tar.getmembers():
                    if member.isfile():
                        f = tar.extractfile(member)
                        if f:
                            return f.read().decode("utf-8", errors="replace")
            return ""
        except NotFound:
            raise ValueError(f"Container {container_id} not found")
        except Exception:
            raise ValueError(f"File {file_path} not found in container")

    def write_file(self, container_id: str, file_path: str, content: str) -> dict:
        try:
            container = self.client.containers.get(container_id)

            # Ensure parent directory exists
            parent_dir = "/".join(file_path.rsplit("/", 1)[:-1])
            if parent_dir:
                container.exec_run(
                    cmd=["mkdir", "-p", parent_dir],
                    user="coder",
                )

            # Create tar archive with file
            stream = io.BytesIO()
            file_data = content.encode("utf-8")
            with tarfile.open(fileobj=stream, mode="w") as tar:
                info = tarfile.TarInfo(name=file_path.split("/")[-1])
                info.size = len(file_data)
                info.uid = 1000
                info.gid = 1000
                tar.addfile(info, io.BytesIO(file_data))
            stream.seek(0)

            container.put_archive(parent_dir or "/", stream)
            return {"status": "ok", "path": file_path}
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def list_files(self, container_id: str, path: str = "/home/coder/project") -> list:
        try:
            container = self.client.containers.get(container_id)
            exit_code, output = container.exec_run(
                cmd=["find", path, "-maxdepth", "10", "-not", "-path", "*/node_modules/*", "-not", "-path", "*/.git/*", "-not", "-path", "*/__pycache__/*", "-not", "-path", "*/.next/*"],
                user="coder",
            )
            if exit_code != 0:
                return []

            lines = output.decode("utf-8", errors="replace").strip().split("\n")
            result = []
            for line in lines:
                if not line.strip():
                    continue
                # Check if it's a directory
                check_code, check_output = container.exec_run(
                    cmd=["test", "-d", line],
                    user="coder",
                )
                is_dir = check_code == 0
                rel_path = line.replace(path, "").lstrip("/")
                if not rel_path:
                    continue
                result.append({
                    "path": rel_path,
                    "absolute_path": line,
                    "is_directory": is_dir,
                    "name": line.split("/")[-1],
                })

            return sorted(result, key=lambda x: (not x["is_directory"], x["path"]))
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def create_exec_interactive(self, container_id: str):
        """Create an interactive exec instance for terminal access."""
        try:
            container = self.client.containers.get(container_id)
            exec_instance = self.client.api.exec_create(
                container.id,
                cmd=["/bin/bash"],
                stdin=True,
                tty=True,
                stdout=True,
                stderr=True,
                user="coder",
                workdir="/home/coder/project",
            )
            socket = self.client.api.exec_start(
                exec_instance["Id"],
                socket=True,
                tty=True,
            )
            return exec_instance["Id"], socket
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def delete_file(self, container_id: str, file_path: str) -> dict:
        try:
            container = self.client.containers.get(container_id)
            exit_code, output = container.exec_run(
                cmd=["rm", "-rf", file_path],
                user="coder",
            )
            return {"status": "ok", "path": file_path}
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def rename_file(self, container_id: str, old_path: str, new_path: str) -> dict:
        try:
            container = self.client.containers.get(container_id)
            exit_code, output = container.exec_run(
                cmd=["mv", old_path, new_path],
                user="coder",
            )
            if exit_code != 0:
                raise RuntimeError(f"Failed to rename: {output.decode()}")
            return {"status": "ok", "old_path": old_path, "new_path": new_path}
        except NotFound:
            raise ValueError(f"Container {container_id} not found")

    def create_directory(self, container_id: str, dir_path: str) -> dict:
        try:
            container = self.client.containers.get(container_id)
            exit_code, output = container.exec_run(
                cmd=["mkdir", "-p", dir_path],
                user="coder",
            )
            return {"status": "ok", "path": dir_path}
        except NotFound:
            raise ValueError(f"Container {container_id} not found")
