"use client";

import { useState } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Code2, ArrowLeft, Globe, Terminal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const templates = [
  {
    id: "nextjs",
    name: "Next.js",
    description: "React framework with App Router, TypeScript, and Tailwind CSS",
    icon: Globe,
    runtime: "node",
    color: "border-blue-500/50 bg-blue-500/5",
  },
  {
    id: "python-fastapi",
    name: "Python FastAPI",
    description: "Modern Python web framework with automatic API docs",
    icon: Terminal,
    runtime: "python",
    color: "border-green-500/50 bg-green-500/5",
  },
  {
    id: "blank",
    name: "Blank",
    description: "Empty workspace with Node.js runtime",
    icon: FileText,
    runtime: "node",
    color: "border-gray-500/50 bg-gray-500/5",
  },
];

export default function NewProjectPage() {
  const { userId } = useAuth();
  const { organization } = useOrganization();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("nextjs");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const orgId = organization?.id || "personal";

  async function handleCreate() {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const template = templates.find((t) => t.id === selectedTemplate)!;
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          template: selectedTemplate,
          orgId,
          runtime: template.runtime,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const data = await res.json();
      router.push(`/workspace/${data.project._id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </button>

      <h1 className="text-2xl font-bold mb-1">Create new project</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Choose a template and configure your development environment
      </p>

      {/* Template Selection */}
      <div className="mb-8">
        <Label className="mb-3 block">Template</Label>
        <div className="grid grid-cols-1 gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border text-left transition-all",
                selectedTemplate === template.id
                  ? `${template.color} border-2`
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <template.icon className="h-6 w-6 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {template.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Project Details */}
      <div className="space-y-4 mb-8">
        <div>
          <Label htmlFor="name" className="mb-2 block">
            Project name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-awesome-project"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <div>
          <Label htmlFor="description" className="mb-2 block">
            Description{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your project"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-4">{error}</p>
      )}

      <Button
        onClick={handleCreate}
        disabled={creating || !name.trim()}
        className="w-full"
        size="lg"
      >
        {creating ? "Creating..." : "Create Project"}
      </Button>
    </div>
  );
}
