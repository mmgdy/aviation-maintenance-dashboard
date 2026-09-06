import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { api } from "@/convex/_generated/api.js";
import PageHeader from "@/components/layout/page-header.tsx";
import InviteEngineerDialog from "./_components/invite-engineer-dialog.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { ShieldCheck, Trash2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function RoleBadge({ role }: { role: "super_admin" | "site_engineer" }) {
  const { t } = useTranslation("common");
  return (
    <Badge variant={role === "super_admin" ? "default" : "secondary"}>{t(`roles.${role}`)}</Badge>
  );
}

export default function AccessPage() {
  const { t } = useTranslation("common");
  const invites = useQuery(api.roles.listInvitedUsers, {});
  const engineers = useQuery(api.roles.listActiveEngineers, {});
  const sites = useQuery(api.sites.listSites, {});
  const deleteInvite = useMutation(api.roles.deleteInvite);
  const removeAccess = useMutation(api.roles.removeEngineerAccess);
  const [pendingRemoval, setPendingRemoval] = useState<{
    type: "invite" | "role";
    id: string;
    name: string;
  } | null>(null);

  const isLoading = invites === undefined || engineers === undefined || sites === undefined;
  const siteNameById = new Map((sites ?? []).map((site) => [site._id, site.name]));

  const handleConfirmRemoval = async () => {
    if (!pendingRemoval) return;
    try {
      if (pendingRemoval.type === "invite") {
        await deleteInvite({ inviteId: pendingRemoval.id as Id<"invitedUsers"> });
      } else {
        await removeAccess({ roleId: pendingRemoval.id as Id<"roles"> });
      }
      toast.success(t("access.removed"));
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? t("errors.generic"));
      } else {
        toast.error(t("errors.generic"));
      }
    } finally {
      setPendingRemoval(null);
    }
  };

  const pendingInvites = invites?.filter((invite) => invite.status === "pending") ?? [];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.access")}
        description={t("access.description")}
        actions={<InviteEngineerDialog />}
      />
      <div className="flex-1 space-y-8 overflow-auto p-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("access.activeUsers")}
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : engineers.length === 0 ? (
            <Empty className="border rounded-xl">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheck />
                </EmptyMedia>
                <EmptyTitle>{t("access.noActiveUsers")}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>{t("common.role")}</TableHead>
                    <TableHead>{t("common.site")}</TableHead>
                    <TableHead>{t("common.department")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engineers.map(({ user, role }) => (
                    <TableRow key={role._id}>
                      <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email ?? "—"}</TableCell>
                      <TableCell>
                        <RoleBadge role={role.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.siteId ? siteNameById.get(role.siteId) ?? "—" : t("engineers.unassigned")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.department ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer text-destructive hover:text-destructive"
                          onClick={() =>
                            setPendingRemoval({
                              type: "role",
                              id: role._id,
                              name: user.name ?? user.email ?? "",
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("access.pendingInvites")}
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : pendingInvites.length === 0 ? (
            <Empty className="border rounded-xl">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheck />
                </EmptyMedia>
                <EmptyTitle>{t("access.noPendingInvites")}</EmptyTitle>
                <EmptyDescription>{t("access.noPendingInvitesDescription")}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>{t("common.role")}</TableHead>
                    <TableHead>{t("common.site")}</TableHead>
                    <TableHead>{t("common.department")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((invite) => (
                    <TableRow key={invite._id}>
                      <TableCell className="font-medium">{invite.name}</TableCell>
                      <TableCell className="text-muted-foreground">{invite.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={invite.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invite.siteId
                          ? siteNameById.get(invite.siteId) ?? "—"
                          : t("engineers.unassigned")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invite.department ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer text-destructive hover:text-destructive"
                          onClick={() =>
                            setPendingRemoval({
                              type: "invite",
                              id: invite._id,
                              name: invite.name,
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>

      <AlertDialog open={!!pendingRemoval} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("access.confirmRemoveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("access.confirmRemoveDescription", { name: pendingRemoval?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void handleConfirmRemoval()}
            >
              {t("buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
