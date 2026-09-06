import { api } from "@/convex/_generated/api.js";
import { useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

export type AccessState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "pending"; user: Doc<"users"> }
  | { status: "granted"; user: Doc<"users">; role: Doc<"roles"> };

/**
 * Resolves the current end user's role-based access state.
 * Must be called from a component rendered inside <Authenticated> to get
 * "granted"/"pending", but is also safe to call anywhere since it checks
 * auth state itself.
 */
export function useAccess(): AccessState {
  const { user, isLoading } = useAuth();
  const access = useQuery(api.roles.getMyAccess, user ? {} : "skip");

  if (isLoading) return { status: "loading" };
  if (!user) return { status: "unauthenticated" };
  if (access === undefined) return { status: "loading" };
  if (!access.role) return { status: "pending", user: access.user };
  return { status: "granted", user: access.user, role: access.role };
}
