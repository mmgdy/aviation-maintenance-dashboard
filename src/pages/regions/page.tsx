import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { api } from "@/convex/_generated/api.js";
import PageHeader from "@/components/layout/page-header.tsx";
import { useAccess } from "@/hooks/use-access.ts";
import RegionFormDialog from "./_components/region-form-dialog.tsx";
import SiteFormDialog from "./_components/site-form-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
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
import { MapPinned, Trash2, ArrowUpRight } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import type { SiteWithRegion } from "@/convex/sites.ts";

type PendingDeletion =
  | { type: "region"; id: Id<"regions">; name: string }
  | { type: "site"; id: Id<"sites">; name: string };

export default function RegionsPage() {
  const { t } = useTranslation("common");
  const { lng } = useParams<{ lng: string }>();
  const access = useAccess();
  const isSuperAdmin = access.status === "granted" && access.role.role === "super_admin";

  const regions = useQuery(api.regions.listRegions, {});
  const sites = useQuery(api.sites.listSites, {});
  const deleteRegion = useMutation(api.regions.deleteRegion);
  const deleteSite = useMutation(api.sites.deleteSite);

  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);

  const sitesByRegion = useMemo(() => {
    const map = new Map<string, SiteWithRegion[]>();
    for (const site of sites ?? []) {
      const list = map.get(site.regionId) ?? [];
      list.push(site);
      map.set(site.regionId, list);
    }
    return map;
  }, [sites]);

  const isLoading = regions === undefined || sites === undefined;

  const handleConfirmDelete = async () => {
    if (!pendingDeletion) return;
    try {
      if (pendingDeletion.type === "region") {
        await deleteRegion({ regionId: pendingDeletion.id });
        toast.success(t("regions.deleted"));
      } else {
        await deleteSite({ siteId: pendingDeletion.id });
        toast.success(t("sites.deleted"));
      }
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? t("errors.generic"));
      } else {
        toast.error(t("errors.generic"));
      }
    } finally {
      setPendingDeletion(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.regions")}
        description={t("regions.description")}
        actions={isSuperAdmin ? <RegionFormDialog /> : undefined}
      />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : regions.length === 0 ? (
          <Empty className="border rounded-xl">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPinned />
              </EmptyMedia>
              <EmptyTitle>{t("regions.noRegions")}</EmptyTitle>
              <EmptyDescription>{t("regions.noRegionsDescription")}</EmptyDescription>
            </EmptyHeader>
            {isSuperAdmin && (
              <EmptyContent>
                <RegionFormDialog />
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <Accordion type="multiple" className="space-y-3" defaultValue={regions.map((r) => r._id)}>
            {regions.map((region) => {
              const regionSites = sitesByRegion.get(region._id) ?? [];
              return (
                <AccordionItem
                  key={region._id}
                  value={region._id}
                  className="rounded-xl border px-4 last:border-b"
                >
                  <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-4 pr-2">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <MapPinned className="size-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{region.name}</div>
                          <div className="text-xs text-muted-foreground">{region.code}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {t("regions.sitesCount", { count: regionSites.length })}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-4">
                    {isSuperAdmin && (
                      <div className="flex items-center justify-end gap-2">
                        <RegionFormDialog region={region} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-destructive hover:text-destructive"
                          onClick={() =>
                            setPendingDeletion({ type: "region", id: region._id, name: region.name })
                          }
                        >
                          <Trash2 className="size-4" />
                          {t("buttons.delete")}
                        </Button>
                        <SiteFormDialog regionId={region._id} regions={regions} />
                      </div>
                    )}
                    {regionSites.length === 0 ? (
                      <Empty className="border rounded-lg py-6">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <MapPinned />
                          </EmptyMedia>
                          <EmptyTitle>{t("sites.noSites")}</EmptyTitle>
                          <EmptyDescription>{t("sites.noSitesDescription")}</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="overflow-hidden rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("sites.name")}</TableHead>
                              <TableHead>{t("sites.type")}</TableHead>
                              <TableHead>{t("sites.leadEngineer")}</TableHead>
                              <TableHead className="text-right">{t("common.actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {regionSites.map((site) => (
                              <TableRow key={site._id}>
                                <TableCell className="font-medium">
                                  <Link
                                    to={`/${lng}/regions/${site._id}`}
                                    className="inline-flex items-center gap-1 hover:underline"
                                  >
                                    {site.name}
                                    <ArrowUpRight className="size-3.5 text-muted-foreground" />
                                  </Link>
                                  <div className="text-xs text-muted-foreground">{site.code}</div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {t(`sites.type.${site.type}`)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {site.leadEngineer?.name ?? t("sites.leadEngineer.none")}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isSuperAdmin && (
                                    <div className="flex justify-end gap-1">
                                      <SiteFormDialog site={site} regions={regions} />
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="cursor-pointer text-destructive hover:text-destructive"
                                        onClick={() =>
                                          setPendingDeletion({
                                            type: "site",
                                            id: site._id,
                                            name: site.name,
                                          })
                                        }
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      <AlertDialog
        open={!!pendingDeletion}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDeletion?.type === "region"
                ? t("regions.confirmDeleteTitle")
                : t("sites.confirmDeleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeletion?.type === "region"
                ? t("regions.confirmDeleteDescription", { name: pendingDeletion.name })
                : t("sites.confirmDeleteDescription", { name: pendingDeletion?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void handleConfirmDelete()}
            >
              {t("buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
