import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server.js";
import type { Doc } from "../_generated/dataModel.d.ts";

export type MyAccess = {
  user: Doc<"users">;
  role: Doc<"roles"> | null;
};

// Resolves the current authenticated user's row + role record (if granted).
export async function resolveMyAccess(ctx: QueryCtx): Promise<MyAccess> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "User not logged in",
    });
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "User record not found",
    });
  }
  const role = await ctx.db
    .query("roles")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .unique();
  return { user, role };
}

// Requires the current user to have any granted role (super_admin or site_engineer).
export async function requireGranted(ctx: QueryCtx): Promise<MyAccess & { role: Doc<"roles"> }> {
  const access = await resolveMyAccess(ctx);
  if (!access.role) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Your account has not been granted access yet",
    });
  }
  return { user: access.user, role: access.role };
}

export async function requireSuperAdmin(ctx: QueryCtx): Promise<MyAccess & { role: Doc<"roles"> }> {
  const access = await requireGranted(ctx);
  if (access.role.role !== "super_admin") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Only Super Admins can perform this action",
    });
  }
  return access;
}
