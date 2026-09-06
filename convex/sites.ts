import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { siteTypeValidator } from "./schema.ts";
import { requireGranted, requireSuperAdmin } from "./lib/access.ts";
import type { Doc } from "./_generated/dataModel.d.ts";

export type SiteWithRegion = Doc<"sites"> & {
  region: Doc<"regions"> | null;
  leadEngineer: Doc<"users"> | null;
};

// The number of sites is bounded (airports/towers/radar stations across a
// handful of regions), so a full collect() stays small and cheap.
export const listSites = query({
  args: {},
  handler: async (ctx): Promise<SiteWithRegion[]> => {
    await requireGranted(ctx);
    const sites = await ctx.db.query("sites").order("asc").take(500);
    const regionCache = new Map<string, Doc<"regions"> | null>();
    const results: SiteWithRegion[] = [];
    for (const site of sites) {
      const key = site.regionId;
      if (!regionCache.has(key)) {
        regionCache.set(key, await ctx.db.get("regions", key));
      }
      const leadEngineer = site.leadEngineerId ? await ctx.db.get("users", site.leadEngineerId) : null;
      results.push({ ...site, region: regionCache.get(key) ?? null, leadEngineer });
    }
    return results;
  },
});

export const listSitesByRegion = query({
  args: { regionId: v.id("regions") },
  handler: async (ctx, args): Promise<Doc<"sites">[]> => {
    await requireGranted(ctx);
    return await ctx.db
      .query("sites")
      .withIndex("by_region", (q) => q.eq("regionId", args.regionId))
      .collect();
  },
});

export type SiteOverview = {
  site: Doc<"sites">;
  region: Doc<"regions"> | null;
  leadEngineer: Doc<"users"> | null;
  team: Array<{ user: Doc<"users">; role: Doc<"roles"> }>;
};

export type SiteOverviewResult =
  | { status: "forbidden" }
  | ({ status: "ok" } & SiteOverview);

export const getSiteOverview = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args): Promise<SiteOverviewResult> => {
    const { role } = await requireGranted(ctx);
    if (role.role === "site_engineer" && role.siteId !== args.siteId) {
      return { status: "forbidden" };
    }
    const site = await ctx.db.get("sites", args.siteId);
    if (!site) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Site not found" });
    }
    const region = await ctx.db.get("regions", site.regionId);
    const leadEngineer = site.leadEngineerId ? await ctx.db.get("users", site.leadEngineerId) : null;
    // The roles table is bounded (one row per granted user), so filtering
    // in-memory for this site's team is cheap and avoids an unindexable
    // optional field.
    const allRoles = await ctx.db.query("roles").take(1000);
    const teamRoles = allRoles.filter((r) => r.siteId === args.siteId);
    const team: Array<{ user: Doc<"users">; role: Doc<"roles"> }> = [];
    for (const teamRole of teamRoles) {
      const user = await ctx.db.get("users", teamRole.userId);
      if (user) team.push({ user, role: teamRole });
    }
    return { status: "ok", site, region, leadEngineer, team };
  },
});

export const createSite = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    regionId: v.id("regions"),
    type: siteTypeValidator,
    leadEngineerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const name = args.name.trim();
    const code = args.code.trim().toUpperCase();
    if (!name || !code) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Name and code are required" });
    }
    const region = await ctx.db.get("regions", args.regionId);
    if (!region) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Region not found" });
    }
    return await ctx.db.insert("sites", {
      name,
      code,
      regionId: args.regionId,
      type: args.type,
      leadEngineerId: args.leadEngineerId,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateSite = mutation({
  args: {
    siteId: v.id("sites"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    regionId: v.optional(v.id("regions")),
    type: v.optional(siteTypeValidator),
    leadEngineerId: v.optional(v.union(v.id("users"), v.null())),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.get("sites", args.siteId);
    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Site not found" });
    }
    if (args.regionId) {
      const region = await ctx.db.get("regions", args.regionId);
      if (!region) {
        throw new ConvexError({ code: "NOT_FOUND", message: "Region not found" });
      }
    }
    const { siteId, ...updates } = args;
    await ctx.db.patch("sites", siteId, {
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
      ...(updates.code !== undefined ? { code: updates.code.trim().toUpperCase() } : {}),
      ...(updates.regionId !== undefined ? { regionId: updates.regionId } : {}),
      ...(updates.type !== undefined ? { type: updates.type } : {}),
      ...(updates.leadEngineerId !== undefined
        ? { leadEngineerId: updates.leadEngineerId ?? undefined }
        : {}),
    });
    return null;
  },
});

export const deleteSite = mutation({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.get("sites", args.siteId);
    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Site not found" });
    }
    const assignedTeam = (await ctx.db.query("roles").take(1000)).find(
      (r) => r.siteId === args.siteId,
    );
    if (assignedTeam) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Reassign all engineers from this site before deleting it",
      });
    }
    await ctx.db.delete("sites", args.siteId);
    return null;
  },
});
