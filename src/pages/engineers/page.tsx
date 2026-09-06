import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { api } from "@/convex/_generated/api.js";
import PageHeader from "@/components/layout/page-header.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Users } from "lucide-react";

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function EngineersPage() {
  const { t } = useTranslation("common");
  const engineers = useQuery(api.roles.listEngineersScoped, {});
  const isLoading = engineers === undefined;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t("nav.engineers")} description={t("engineers.description")} />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : engineers.length === 0 ? (
          <Empty className="border rounded-xl">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>{t("engineers.noEngineers")}</EmptyTitle>
              <EmptyDescription>{t("engineers.noEngineersDescription")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.role")}</TableHead>
                  <TableHead>{t("common.site")}</TableHead>
                  <TableHead>{t("common.department")}</TableHead>
                  <TableHead>{t("common.phone")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engineers.map(({ user, role, site }) => (
                  <TableRow key={role._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {user.name ?? user.email}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.role === "super_admin" ? "default" : "secondary"}>
                        {t(`roles.${role.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {site?.name ?? t("engineers.unassigned")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.department ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{role.phone ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
