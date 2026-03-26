const CONTAINER_SERVICE_URL =
  process.env.NEXT_PUBLIC_CONTAINER_SERVICE_URL || "http://localhost:8000";
const API_KEY = process.env.CONTAINER_SERVICE_API_KEY || "dev-secret-key";

interface ContainerCreateRequest {
  workspace_id: string;
  template: string;
  runtime: string;
  cpu_limit?: number;
  memory_limit?: string;
}

interface ContainerCreateResponse {
  container_id: string;
  short_id: string;
  name: string;
  status: string;
  port: number;
}

interface FileTreeItem {
  path: string;
  absolute_path: string;
  is_directory: boolean;
  name: string;
}

interface ExecResult {
  exit_code: number;
  output: string;
}

const headers = {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
};

export const containerApi = {
  async createContainer(
    data: ContainerCreateRequest
  ): Promise<ContainerCreateResponse> {
    const res = await fetch(`${CONTAINER_SERVICE_URL}/containers/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create container");
    }
    return res.json();
  },

  async startContainer(containerId: string): Promise<{ status: string }> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/containers/${containerId}/start`,
      { method: "POST", headers }
    );
    if (!res.ok) throw new Error("Failed to start container");
    return res.json();
  },

  async stopContainer(containerId: string): Promise<{ status: string }> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/containers/${containerId}/stop`,
      { method: "POST", headers }
    );
    if (!res.ok) throw new Error("Failed to stop container");
    return res.json();
  },

  async deleteContainer(containerId: string): Promise<{ status: string }> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/containers/${containerId}`,
      { method: "DELETE", headers }
    );
    if (!res.ok) throw new Error("Failed to delete container");
    return res.json();
  },

  async getContainerStatus(
    containerId: string
  ): Promise<{ status: string; container_id: string }> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/containers/${containerId}/status`,
      { headers }
    );
    if (!res.ok) throw new Error("Failed to get status");
    return res.json();
  },

  async execCommand(
    containerId: string,
    command: string,
    workdir?: string
  ): Promise<ExecResult> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/containers/${containerId}/exec`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ command, workdir }),
      }
    );
    if (!res.ok) throw new Error("Failed to exec command");
    return res.json();
  },

  async readFile(
    containerId: string,
    path: string
  ): Promise<{ path: string; content: string }> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/files/${containerId}/read?path=${encodeURIComponent(path)}`,
      { headers }
    );
    if (!res.ok) throw new Error("Failed to read file");
    return res.json();
  },

  async writeFile(
    containerId: string,
    path: string,
    content: string
  ): Promise<{ status: string }> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/files/${containerId}/write`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ path, content }),
      }
    );
    if (!res.ok) throw new Error("Failed to write file");
    return res.json();
  },

  async listFiles(
    containerId: string,
    path?: string
  ): Promise<{ files: FileTreeItem[] }> {
    const url = path
      ? `${CONTAINER_SERVICE_URL}/files/${containerId}/tree?path=${encodeURIComponent(path)}`
      : `${CONTAINER_SERVICE_URL}/files/${containerId}/tree`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Failed to list files");
    return res.json();
  },

  async deleteFile(
    containerId: string,
    path: string
  ): Promise<{ status: string }> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/files/${containerId}/delete?path=${encodeURIComponent(path)}`,
      { method: "DELETE", headers }
    );
    if (!res.ok) throw new Error("Failed to delete file");
    return res.json();
  },

  async renameFile(
    containerId: string,
    oldPath: string,
    newPath: string
  ): Promise<{ status: string }> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/files/${containerId}/rename`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ old_path: oldPath, new_path: newPath }),
      }
    );
    if (!res.ok) throw new Error("Failed to rename file");
    return res.json();
  },

  async createDirectory(
    containerId: string,
    path: string
  ): Promise<{ status: string }> {
    const res = await fetch(
      `${CONTAINER_SERVICE_URL}/files/${containerId}/mkdir`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ path }),
      }
    );
    if (!res.ok) throw new Error("Failed to create directory");
    return res.json();
  },

  getTerminalWsUrl(containerId: string): string {
    const wsBase = CONTAINER_SERVICE_URL.replace("http", "ws");
    return `${wsBase}/ws/terminal/${containerId}`;
  },

  getPreviewUrl(port: number): string {
    return `http://localhost:${port}`;
  },
};
