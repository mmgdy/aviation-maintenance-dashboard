import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const roleValidator = v.union(
  v.literal("super_admin"),
  v.literal("site_engineer"),
);

export const siteTypeValidator = v.union(
  v.literal("airport"),
  v.literal("tower"),
  v.literal("radar_station"),
  v.literal("other"),
);

export default defineSchema({
  // Provides `users`, `authAccounts`, `authSessions`, etc. — including a
  // `users` table indexed by "email" — managed by Convex Auth.
  ...authTables,

  // One role record per user. Absence of a record means the user is
  // authenticated but has not been granted access yet (pending invite).
  roles: defineTable({
    userId: v.id("users"),
    role: roleValidator,
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    siteId: v.optional(v.id("sites")),
    createdAt: v.string(),
  }).index("by_user", ["userId"]),

  // Engineers pre-registered by a Super Admin before they ever sign in.
  // When a user signs in with a matching email, the invite is consumed
  // and turned into a `roles` record for that user.
  invitedUsers: defineTable({
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    siteId: v.optional(v.id("sites")),
    status: v.union(v.literal("pending"), v.literal("activated")),
    invitedByUserId: v.id("users"),
    activatedUserId: v.optional(v.id("users")),
    createdAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // Top-level geographic regions (Northern, Southern, Central, Sinai, etc.)
  regions: defineTable({
    name: v.string(),
    code: v.string(),
    createdAt: v.string(),
  }),

  // Sites/airports/towers/radar stations that belong to a region.
  sites: defineTable({
    name: v.string(),
    code: v.string(),
    regionId: v.id("regions"),
    type: siteTypeValidator,
    leadEngineerId: v.optional(v.id("users")),
    createdAt: v.string(),
  }).index("by_region", ["regionId"]),
});
