import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { api } from "@/convex/_generated/api.js";
import PageHeader from "@/components/layout/page-header.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  ErrorState,
  ErrorStateContent,
  ErrorStateHeader,
  ErrorStateMedia,
  ErrorStateTitle,
} from "@/components/ui/error-state.tsx";
import { ArrowLeft, Cog, Package, ShieldAlert, Users } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function SiteDetailPage() {
  const { t } = useTranslation("common");
  const { lng, siteId } = useParams<{ lng: string; siteId: string }>();
  const overview = useQuery(
    api.sites.getSiteOverview,
    siteId ? { siteId: siteId as Id<"sites"> } : "skip",
  );

  const isLoading = overview === undefined;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={overview?.status === "ok" ? overview.site.name : t("sites.overview")}
        description={
          overview?.status === "ok"
            ? `${overview.region?.name ?? ""} · ${overview.site.code}`
            : undefined
        }
        actions={
          <Button variant="secondary" size="sm" asChild className="cursor-pointer">
            <Link to={`/${lng}/regions`}>
              <ArrowLeft className="size-4" />
              {t("sites.backToRegions")}
            </Link>
          </Button>
        }
      />
      <div className="flex-1 space-y-6 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : overview.status === "forbidden" ? (
          <ErrorState>
            <ErrorStateHeader>
              <ErrorStateMedia variant="icon">
                <ShieldAlert />
              </ErrorStateMedia>
              <ErrorStateTitle>{t("errors.forbidden")}</ErrorStateTitle>
            </ErrorStateHeader>
            <ErrorStateContent>
              <Button size="sm" asChild className="cursor-pointer">
                <Link to={`/${lng}`}>{t("buttons.returnHome")}</Link>
              </Button>
            </ErrorStateContent>
          </ErrorState>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("sites.type")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-semibold">
                  {t(`sites.type.${overview.site.type}`)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("common.region")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-semibold">
                  {overview.region?.name ?? "—"}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("sites.leadEngineer")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-semibold">
                  {overview.leadEngineer?.name ?? t("sites.leadEngineer.none")}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-muted-foreground" />
                  {t("sites.team")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overview.team.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Users />
                      </EmptyMedia>
                      <EmptyTitle>{t("sites.noTeam")}</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="space-y-3">
                    {overview.team.map(({ user, role }) => (
                      <div key={role._id} className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium">
                            {user.name ?? user.email}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                        <Badge variant="secondary">{t(`roles.${role.role}`)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Cog className="size-4 text-muted-foreground" />
                    {t("sites.equipmentSummary")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {t("sites.equipmentComingSoon")}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="size-4 text-muted-foreground" />
                    {t("nav.inventory")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {t("sites.equipmentComingSoon")}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
