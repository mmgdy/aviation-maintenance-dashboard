import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api.js";

// Compatible replacement for the old Hercules `useAuth()` — same shape
// (`user`, `isLoading`, `isAuthenticated`, `signout`) so existing
// components didn't need to change, just backed by Convex Auth now.
// `user` is the actual `users` table row (has top-level `name`/`email`),
// not an OIDC profile object.
export function useAuth() {
  const { isAuthenticated, isLoading: sessionLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");

  return {
    isAuthenticated,
    isLoading: sessionLoading || (isAuthenticated && user === undefined),
    user: user ?? null,
    signout: signOut,
  };
}
