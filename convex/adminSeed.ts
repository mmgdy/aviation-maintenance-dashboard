import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

const ADMIN_EMAIL = "admin@admin.local";
const ADMIN_PASSWORD = "UR2qjm4qYJ7n5AHJ";

export const seedAdmin = internalAction({
  args: {},
  handler: async (ctx): Promise<string> => {
    const provider = Password({});
    try {
      await createAccount(ctx, {
        provider,
        account: { id: ADMIN_EMAIL, secret: ADMIN_PASSWORD },
        profile: { email: ADMIN_EMAIL },
        shouldLinkViaEmail: false,
        shouldLinkViaPhone: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.toLowerCase().includes("already exists")) {
        throw err;
      }
    }

    await ctx.runMutation(internal.adminSeed.grantSuperAdmin, {
      email: ADMIN_EMAIL,
    });

    return `Admin ready — sign in with ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}. Change the password after logging in.`;
  },
});

export const grantSuperAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user) {
      throw new Error("Admin user not found after sign-up — seeding failed.");
    }
    const existingRole = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existingRole) {
      await ctx.db.patch("roles", existingRole._id, { role: "super_admin" });
    } else {
      await ctx.db.insert("roles", {
        userId: user._id,
        role: "super_admin",
        createdAt: new Date().toISOString(),
      });
    }
  },
});
