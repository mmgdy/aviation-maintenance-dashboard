import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireGranted, requireSuperAdmin } from "./lib/access.ts";
import type { Doc } from "./_generated/dataModel.d.ts";

// Regions are a small, bounded reference list (a handful of records), so a
// simple collect() is fine and stays cheap even as sites/engineers grow.
export const listRegions = query({
  args: {},
  handler: async (ctx): Promise<Doc<"regions">[]> => {
    await requireGranted(ctx);
    return await ctx.db.query("regions").order("asc").take(200);
  },
});

export const createRegion = mutation({
  args: { name: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const name = args.name.trim();
    const code = args.code.trim().toUpperCase();
    if (!name || !code) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Name and code are required" });
    }
    return await ctx.db.insert("regions", { name, code, createdAt: new Date().toISOString() });
  },
});

export const updateRegion = mutation({
  args: { regionId: v.id("regions"), name: v.optional(v.string()), code: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.get("regions", args.regionId);
    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Region not found" });
    }
    await ctx.db.patch("regions", args.regionId, {
      ...(args.name !== undefined ? { name: args.name.trim() } : {}),
      ...(args.code !== undefined ? { code: args.code.trim().toUpperCase() } : {}),
    });
    return null;
  },
});

export const deleteRegion = mutation({
  args: { regionId: v.id("regions") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.get("regions", args.regionId);
    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Region not found" });
    }
    const sitesInRegion = await ctx.db
      .query("sites")
      .withIndex("by_region", (q) => q.eq("regionId", args.regionId))
      .first();
    if (sitesInRegion) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Remove or reassign all sites in this region before deleting it",
      });
    }
    await ctx.db.delete("regions", args.regionId);
    return null;
  },
});
