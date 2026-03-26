import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrganization extends Document {
  clerkOrgId: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  settings: {
    maxWorkspaces: number;
    maxMembersPerWorkspace: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    clerkOrgId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    settings: {
      maxWorkspaces: { type: Number, default: 10 },
      maxMembersPerWorkspace: { type: Number, default: 5 },
    },
  },
  { timestamps: true }
);

export const Organization: Model<IOrganization> =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", organizationSchema);
