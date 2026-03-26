import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkspace extends Document {
  projectId: string;
  userId: string;
  containerId: string;
  status: "creating" | "running" | "stopped" | "error";
  port: number;
  lastActiveAt: Date;
  resources: {
    cpu: number;
    memory: string;
    disk: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    containerId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["creating", "running", "stopped", "error"],
      default: "creating",
    },
    port: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    resources: {
      cpu: { type: Number, default: 0.5 },
      memory: { type: String, default: "256m" },
      disk: { type: String, default: "1g" },
    },
  },
  { timestamps: true }
);

workspaceSchema.index({ projectId: 1, userId: 1 });

export const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace ||
  mongoose.model<IWorkspace>("Workspace", workspaceSchema);
