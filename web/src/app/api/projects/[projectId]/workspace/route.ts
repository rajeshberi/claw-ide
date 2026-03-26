import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Project, Workspace } from "@/lib/models";
import { containerApi } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Check if workspace already exists
  let workspace = await Workspace.findOne({
    projectId: params.projectId,
    userId,
  });

  if (workspace && workspace.status === "running") {
    // Verify container is still running
    try {
      const status = await containerApi.getContainerStatus(
        workspace.containerId
      );
      if (status.status === "running") {
        workspace.lastActiveAt = new Date();
        await workspace.save();
        return NextResponse.json({ workspace });
      }
    } catch {
      // Container is gone, recreate
      workspace.status = "error";
      await workspace.save();
    }
  }

  return NextResponse.json({ workspace: workspace || null });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const project = await Project.findById(params.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Check for existing workspace
  let workspace = await Workspace.findOne({
    projectId: params.projectId,
    userId,
  });

  if (workspace && workspace.status === "running") {
    try {
      await containerApi.getContainerStatus(workspace.containerId);
      workspace.lastActiveAt = new Date();
      await workspace.save();
      return NextResponse.json({ workspace });
    } catch {
      // Container gone, clean up
      await Workspace.findByIdAndDelete(workspace._id);
    }
  } else if (workspace) {
    // Clean up old workspace
    if (workspace.containerId) {
      try {
        await containerApi.deleteContainer(workspace.containerId);
      } catch {}
    }
    await Workspace.findByIdAndDelete(workspace._id);
  }

  // Create new workspace
  workspace = await Workspace.create({
    projectId: params.projectId,
    userId,
    status: "creating",
    resources: project.settings.resources,
  });

  try {
    const container = await containerApi.createContainer({
      workspace_id: workspace._id.toString(),
      template: project.template,
      runtime: project.settings.runtime,
      cpu_limit: project.settings.resources.cpu,
      memory_limit: project.settings.resources.memory,
    });

    workspace.containerId = container.container_id;
    workspace.port = container.port;
    workspace.status = "running";
    workspace.lastActiveAt = new Date();
    await workspace.save();

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (err: any) {
    workspace.status = "error";
    await workspace.save();
    return NextResponse.json(
      { error: `Failed to create container: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const workspace = await Workspace.findOne({
    projectId: params.projectId,
    userId,
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (workspace.containerId) {
    try {
      await containerApi.deleteContainer(workspace.containerId);
    } catch {}
  }

  await Workspace.findByIdAndDelete(workspace._id);

  return NextResponse.json({ status: "deleted" });
}
