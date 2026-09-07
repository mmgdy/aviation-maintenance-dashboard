import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get("users", userId);
  },
});

// Idempotent — safe to call every time a user signs in. Grants super_admin
// to the very first person ever to authenticate against this deployment,
// or consumes a matching pending invite by email. Otherwise leaves the
// user in the "pending" state (authenticated, no role yet) until a Super
// Admin invites them.
export const ensureAccess = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const existingRole = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existingRole) return existingRole;

    const now = new Date().toISOString();
    const anyRole = await ctx.db.query("roles").first();

    if (anyRole === null) {
      const roleId = await ctx.db.insert("roles", {
        userId,
        role: "super_admin",
        createdAt: now,
      });
      return await ctx.db.get("roles", roleId);
    }

    const user = await ctx.db.get("users", userId);
    const email = user?.email?.toLowerCase();
    if (email) {
      const invite = await ctx.db
        .query("invitedUsers")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (invite && invite.status === "pending") {
        const roleId = await ctx.db.insert("roles", {
          userId,
          role: invite.role,
          department: invite.department,
          phone: invite.phone,
          siteId: invite.siteId,
          createdAt: now,
        });
        await ctx.db.patch("invitedUsers", invite._id, {
          status: "activated",
          activatedUserId: userId,
        });
        return await ctx.db.get("roles", roleId);
      }
    }

    return null;
  },
});
