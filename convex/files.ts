import { mutation, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { isApprovedVantaIdentity } from "./access";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    return await ctx.storage.generateUploadUrl();
  },
});

export const recordUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    contentType: v.string(),
  },
  returns: v.id("uploadedDocuments"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) throw new Error("Uploaded file was not found");
    if (metadata.size > 10 * 1024 * 1024) throw new Error("Files must be 10 MB or smaller");
    const type = args.contentType.toLowerCase();
    if (!new Set(["application/pdf", "text/plain"]).has(type)) {
      throw new Error("Upload a PDF or plain text document");
    }
    return await ctx.db.insert("uploadedDocuments", {
      ownerId: identity.subject,
      storageId: args.storageId,
      name: args.name.slice(0, 200),
      contentType: type,
      createdAt: Date.now(),
    });
  },
});

export const deleteOwnedDocument = internalMutation({
  args: { id: v.id("uploadedDocuments"), ownerId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.ownerId !== args.ownerId) return null;
    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(args.id);
    return null;
  },
});

export const getOwnedDocument = internalQuery({
  args: { id: v.id("uploadedDocuments"), ownerId: v.string() },
  returns: v.union(v.null(), v.object({ storageId: v.id("_storage"), name: v.string(), contentType: v.string() })),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.ownerId !== args.ownerId) return null;
    return { storageId: doc.storageId, name: doc.name, contentType: doc.contentType };
  },
});
