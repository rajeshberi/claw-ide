import threading
from typing import Optional


class PortManager:
    """Manages port allocation for workspace containers."""

    def __init__(self, start_port: int = 10000, end_port: int = 11000):
        self.start_port = start_port
        self.end_port = end_port
        self._allocated: dict[str, int] = {}  # workspace_id -> port
        self._used_ports: set[int] = set()
        self._lock = threading.Lock()

    def allocate(self, workspace_id: str) -> int:
        with self._lock:
            if workspace_id in self._allocated:
                return self._allocated[workspace_id]

            for port in range(self.start_port, self.end_port):
                if port not in self._used_ports:
                    self._used_ports.add(port)
                    self._allocated[workspace_id] = port
                    return port

            raise RuntimeError("No available ports")

    def release(self, workspace_id: str) -> Optional[int]:
        with self._lock:
            port = self._allocated.pop(workspace_id, None)
            if port:
                self._used_ports.discard(port)
            return port

    def get_port(self, workspace_id: str) -> Optional[int]:
        return self._allocated.get(workspace_id)
