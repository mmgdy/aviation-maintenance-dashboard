import { AuthConfig } from "convex/server";

// Convex Auth issues and validates its own JWTs — the "provider" here is
// this Convex deployment itself (CONVEX_SITE_URL), not an external OIDC
// service. No Hercules/third-party identity provider is involved anymore.
export default {
  providers: [
    {
      // Convex provides CONVEX_SITE_URL in every deployment environment.
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
