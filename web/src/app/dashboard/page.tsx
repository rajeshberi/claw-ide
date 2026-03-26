"use client";

import { useEffect, useState } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Code2,
  Folder,
  MoreVertical,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  _id: string;
  name: string;
  description: string;
  template: string;
  createdAt: string;
  updatedAt: string;
}

const templateIcons: Record<string, string> = {
  nextjs: "N",
  "python-fastapi": "Py",
  blank: "B",
};

const templateColors: Record<string, string> = {
  nextjs: "bg-blue-500/20 text-blue-400",
  "python-fastapi": "bg-green-500/20 text-green-400",
  blank: "bg-gray-500/20 text-gray-400",
};

export default function DashboardPage() {
  const { userId } = useAuth();
  const { organization } = useOrganization();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = organization?.id || "personal";

  useEffect(() => {
    fetchProjects();
  }, [orgId]);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?orgId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject(projectId: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p._id !== projectId));
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  }

  function openProject(projectId: string) {
    router.push(`/workspace/${projectId}`);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {organization
              ? `${organization.name}'s projects`
              : "Your personal projects"}
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-lg border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">No projects yet</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Create your first project to get started
          </p>
          <Button onClick={() => router.push("/dashboard/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project._id}
              className="group relative rounded-lg border border-border bg-card hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => openProject(project._id)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-md flex items-center justify-center text-sm font-bold ${
                        templateColors[project.template] || templateColors.blank
                      }`}
                    >
                      {templateIcons[project.template] || "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {project.template}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
