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
  const project = await Project.findById(params.projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
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

  const project = await Project.findById(params.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Clean up any workspaces/containers
  const workspaces = await Workspace.find({ projectId: params.projectId });
  for (const ws of workspaces) {
    if (ws.containerId) {
      try {
        await containerApi.deleteContainer(ws.containerId);
      } catch (e) {
        // Container may already be gone
      }
    }
  }
  await Workspace.deleteMany({ projectId: params.projectId });
  await Project.findByIdAndDelete(params.projectId);

  return NextResponse.json({ status: "deleted" });
}
