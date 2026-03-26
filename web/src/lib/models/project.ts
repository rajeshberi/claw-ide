import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICollaborator {
  userId: string;
  role: "owner" | "editor" | "viewer";
}

export interface IProject extends Document {
  orgId: string;
  name: string;
  description: string;
  template: "nextjs" | "python-fastapi" | "blank";
  createdBy: string;
  collaborators: ICollaborator[];
  settings: {
    runtime: string;
    resources: {
      cpu: number;
      memory: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const collaboratorSchema = new Schema<ICollaborator>(
  {
    userId: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "editor", "viewer"],
      default: "editor",
    },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    orgId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    template: {
      type: String,
      enum: ["nextjs", "python-fastapi", "blank"],
      default: "blank",
    },
    createdBy: { type: String, required: true },
    collaborators: [collaboratorSchema],
    settings: {
      runtime: { type: String, default: "node" },
      resources: {
        cpu: { type: Number, default: 0.5 },
        memory: { type: String, default: "256m" },
      },
    },
  },
  { timestamps: true }
);

projectSchema.index({ orgId: 1, name: 1 });

export const Project: Model<IProject> =
  mongoose.models.Project ||
  mongoose.model<IProject>("Project", projectSchema);
