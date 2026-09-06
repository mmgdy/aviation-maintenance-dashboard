import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { roleValidator } from "./schema.ts";
import { resolveMyAccess, requireGranted, requireSuperAdmin } from "./lib/access.ts";
import type { Doc } from "./_generated/dataModel.d.ts";
import type { MyAccess } from "./lib/access.ts";

// Returns the current user's access record, or null role if they haven't
// been granted access yet (pending invite / not yet invited).
export const getMyAccess = query({
  args: {},
  handler: async (ctx): Promise<MyAccess> => {
    return await resolveMyAccess(ctx);
  },
});

export const listInvitedUsers = query({
  args: {},
  handler: async (ctx): Promise<Doc<"invitedUsers">[]> => {
    await requireSuperAdmin(ctx);
    return await ctx.db.query("invitedUsers").order("desc").take(500);
  },
});

export const listActiveEngineers = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<Array<{ user: Doc<"users">; role: Doc<"roles">; site: Doc<"sites"> | null }>> => {
    await requireSuperAdmin(ctx);
    const roles = await ctx.db.query("roles").order("desc").take(500);
    const results: Array<{ user: Doc<"users">; role: Doc<"roles">; site: Doc<"sites"> | null }> = [];
    for (const role of roles) {
      const user = await ctx.db.get("users", role.userId);
      const site = role.siteId ? await ctx.db.get("sites", role.siteId) : null;
      if (user) results.push({ user, role, site });
    }
    return results;
  },
});

// Returns engineers visible to the current user: Super Admins see everyone,
// Site Engineers see only their own site's team (read-only).
export const listEngineersScoped = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<Array<{ user: Doc<"users">; role: Doc<"roles">; site: Doc<"sites"> | null }>> => {
    const { role: myRole } = await requireGranted(ctx);
    const roles = await ctx.db.query("roles").order("desc").take(500);
    const scoped =
      myRole.role === "super_admin" ? roles : roles.filter((r) => r.siteId === myRole.siteId);
    const results: Array<{ user: Doc<"users">; role: Doc<"roles">; site: Doc<"sites"> | null }> = [];
    for (const role of scoped) {
      const user = await ctx.db.get("users", role.userId);
      const site = role.siteId ? await ctx.db.get("sites", role.siteId) : null;
      if (user) results.push({ user, role, site });
    }
    return results;
  },
});

export const inviteEngineer = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    siteId: v.optional(v.id("sites")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireSuperAdmin(ctx);
    const email = args.email.trim().toLowerCase();
    if (!email) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Email is required" });
    }

    const existingInvite = await ctx.db
      .query("invitedUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingInvite) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "An invite for this email already exists",
      });
    }

    return await ctx.db.insert("invitedUsers", {
      email,
      name: args.name.trim(),
      role: args.role,
      department: args.department,
      phone: args.phone,
      siteId: args.siteId,
      status: "pending",
      invitedByUserId: user._id,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateInvite = mutation({
  args: {
    inviteId: v.id("invitedUsers"),
    name: v.optional(v.string()),
    role: v.optional(roleValidator),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    siteId: v.optional(v.id("sites")),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const invite = await ctx.db.get("invitedUsers", args.inviteId);
    if (!invite) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Invite not found" });
    }
    if (invite.status === "activated") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Cannot edit an invite that has already been activated",
      });
    }
    const { inviteId, ...updates } = args;
    await ctx.db.patch("invitedUsers", inviteId, {
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
      ...(updates.role !== undefined ? { role: updates.role } : {}),
      ...(updates.department !== undefined ? { department: updates.department } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.siteId !== undefined ? { siteId: updates.siteId } : {}),
    });
    return null;
  },
});

export const deleteInvite = mutation({
  args: { inviteId: v.id("invitedUsers") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const invite = await ctx.db.get("invitedUsers", args.inviteId);
    if (!invite) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Invite not found" });
    }
    await ctx.db.delete("invitedUsers", args.inviteId);
    return null;
  },
});

export const updateEngineerRole = mutation({
  args: {
    roleId: v.id("roles"),
    role: v.optional(roleValidator),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    siteId: v.optional(v.id("sites")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireSuperAdmin(ctx);
    const existing = await ctx.db.get("roles", args.roleId);
    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Role record not found" });
    }
    if (existing.userId === user._id && args.role && args.role !== "super_admin") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "You cannot demote yourself",
      });
    }
    const { roleId, ...updates } = args;
    await ctx.db.patch("roles", roleId, {
      ...(updates.role !== undefined ? { role: updates.role } : {}),
      ...(updates.department !== undefined ? { department: updates.department } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.siteId !== undefined ? { siteId: updates.siteId } : {}),
    });
    return null;
  },
});

export const removeEngineerAccess = mutation({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    const { user } = await requireSuperAdmin(ctx);
    const existing = await ctx.db.get("roles", args.roleId);
    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Role record not found" });
    }
    if (existing.userId === user._id) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "You cannot remove your own access",
      });
    }
    await ctx.db.delete("roles", args.roleId);
    return null;
  },
});
