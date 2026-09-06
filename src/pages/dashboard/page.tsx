import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import PageHeader from "@/components/layout/page-header.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useAccess } from "@/hooks/use-access.ts";
import { Cog, GraduationCap, MapPinned, Package } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation("common");
  const access = useAccess();
  const roleLabel = access.status === "granted" ? t(`roles.${access.role.role}`) : "";
  const sites = useQuery(api.sites.listSites, {});

  const summaryCards = [
    { key: "nav.regions", icon: MapPinned, value: sites ? String(sites.length) : undefined },
    { key: "nav.licensing", icon: GraduationCap, value: undefined },
    { key: "nav.equipment", icon: Cog, value: undefined },
    { key: "nav.inventory", icon: Package, value: undefined },
  ] as const;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.dashboard")}
        description={t("app.fullName")}
        actions={roleLabel ? <Badge variant="secondary">{roleLabel}</Badge> : undefined}
      />
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(card.key)}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value ?? "—"}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
