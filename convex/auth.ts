import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

// Self-hosted email + password auth — no external identity provider.
// See providers/Password docs if you later want email verification or
// a "forgot password" flow (both are supported by this same provider).
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
