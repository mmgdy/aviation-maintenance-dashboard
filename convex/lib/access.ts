import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx } from "../_generated/server.js";
import type { Doc } from "../_generated/dataModel.d.ts";

export type MyAccess = {
  user: Doc<"users">;
  role: Doc<"roles"> | null;
};

// Resolves the current authenticated user's row + role record (if granted).
export async function resolveMyAccess(ctx: QueryCtx): Promise<MyAccess> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "User not logged in",
    });
  }
  const user = await ctx.db.get("users", userId);
  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "User record not found",
    });
  }
  const role = await ctx.db
    .query("roles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
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
