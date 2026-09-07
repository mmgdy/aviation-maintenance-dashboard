import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

const ADMIN_EMAIL = "admin@admin.local";
const ADMIN_PASSWORD = "admin";

// Run once after your first deploy:
//
//   npx convex run adminSeed:seedAdmin
//
// Creates (or upgrades) a super_admin account you can log in with
// immediately: admin@admin.local / admin
//
// "admin" is intentionally weak and only meant to get you into the app
// once — change the password (or delete this account and create a real
// one) right after your first login.
export const seedAdmin = internalAction({
  args: {},
  handler: async (ctx): Promise<string> => {
    try {
      await ctx.runAction(api.auth.signIn, {
        provider: "password",
        params: {
            email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        },
      });
    } catch (err) {
      // If the account already exists, that's fine — we just need to make
      // sure it (still) has the super_admin role, handled below.
      const message = err instanceof Error ? err.message : String(err);
      if (!message.toLowerCase().includes("exist")) {
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
