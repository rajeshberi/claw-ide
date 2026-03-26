"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const EditorLayout = dynamic(
  () => import("@/components/editor/EditorLayout"),
  { ssr: false }
);

interface WorkspaceData {
  _id: string;
  containerId: string;
  status: string;
  port: number;
}

interface ProjectData {
  _id: string;
  name: string;
  template: string;
  settings: {
    runtime: string;
  };
}

const CONTAINER_SERVICE_URL =
  process.env.NEXT_PUBLIC_CONTAINER_SERVICE_URL || "http://localhost:8000";
const API_KEY = process.env.CONTAINER_SERVICE_API_KEY || "dev-secret-key";

export default function WorkspacePage() {
  const { userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [status, setStatus] = useState<
    "loading" | "creating" | "ready" | "error"
  >("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId || !projectId) return;
    initWorkspace();
  }, [userId, projectId]);

  async function initWorkspace() {
    setStatus("loading");
    setError("");

    try {
      // Fetch project details
      const projectRes = await fetch(`/api/projects/${projectId}`);
      if (!projectRes.ok) {
        throw new Error("Project not found");
      }
      const projectData = await projectRes.json();
      setProject(projectData.project);

      // Check for existing workspace
      const wsRes = await fetch(`/api/projects/${projectId}/workspace`);
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        if (wsData.workspace && wsData.workspace.status === "running") {
          setWorkspace(wsData.workspace);
          setStatus("ready");
          return;
        }
      }

      // Create new workspace
      setStatus("creating");
      const createRes = await fetch(`/api/projects/${projectId}/workspace`, {
        method: "POST",
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || "Failed to create workspace");
      }

      const createData = await createRes.json();
      setWorkspace(createData.workspace);
      setStatus("ready");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  }

  if (status === "loading" || status === "creating") {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-1">
            {status === "loading"
              ? "Loading workspace..."
              : "Creating your environment..."}
          </h2>
          <p className="text-sm text-muted-foreground">
            {status === "creating"
              ? "Setting up a Docker container with your template. This may take a moment."
              : "Please wait..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">
            Failed to start workspace
          </h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button onClick={initWorkspace}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace || !project) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-card">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">{project.name}</span>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
          {project.template}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Container Running</span>
        </div>
      </div>

      {/* IDE */}
      <div className="flex-1 overflow-hidden">
        <EditorLayout
          containerId={workspace.containerId}
          containerServiceUrl={CONTAINER_SERVICE_URL}
          apiKey={API_KEY}
          port={workspace.port}
          template={project.template}
        />
      </div>
    </div>
  );
}
