import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models";

export async function GET(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = request.nextUrl.searchParams.get("orgId") || "personal";

  await connectDB();
  const projects = await Project.find({ orgId }).sort({ updatedAt: -1 });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, template, orgId, runtime } = body;

  if (!name || !template) {
    return NextResponse.json(
      { error: "Name and template are required" },
      { status: 400 }
    );
  }

  await connectDB();

  const project = await Project.create({
    orgId: orgId || "personal",
    name,
    description: description || "",
    template,
    createdBy: userId,
    collaborators: [{ userId, role: "owner" }],
    settings: {
      runtime: runtime || "node",
      resources: { cpu: 0.5, memory: "256m" },
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
