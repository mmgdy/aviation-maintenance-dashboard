import { ConvexError } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

// Grants a role to a brand new user: the very first user ever to sign in
// becomes the Super Admin. Otherwise, consume a pending invite matching
// their email (case-insensitive), if any.
async function bootstrapRoleForNewUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  email: string | undefined,
): Promise<void> {
  const anyRole = await ctx.db.query("roles").first();
  const now = new Date().toISOString();

  if (anyRole === null) {
    await ctx.db.insert("roles", {
      userId,
      role: "super_admin",
      createdAt: now,
    });
    return;
  }

  if (!email) return;

  const invite = await ctx.db
    .query("invitedUsers")
    .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
    .first();

  if (!invite || invite.status === "activated") return;

  await ctx.db.insert("roles", {
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
}

export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    // Check if we've already stored this identity before.
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (existingUser !== null) {
      return existingUser._id;
    }

    // If it's a new identity, create a new User and assign a role.
    const userId = await ctx.db.insert("users", {
      name: identity.name,
      email: identity.email,
      tokenIdentifier: identity.tokenIdentifier,
    });
    await bootstrapRoleForNewUser(ctx, userId, identity.email);
    return userId;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Called getCurrentUser without authentication present",
      });
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    return user;
  },
});
