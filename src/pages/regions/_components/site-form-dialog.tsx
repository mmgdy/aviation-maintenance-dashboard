import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Plus, Loader2 } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";

const SITE_TYPES = ["airport", "tower", "radar_station", "other"] as const;
const NONE_VALUE = "none";

export default function SiteFormDialog({
  site,
  regionId,
  regions,
}: {
  site?: Doc<"sites">;
  regionId?: Id<"regions">;
  regions: Doc<"regions">[];
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const createSite = useMutation(api.sites.createSite);
  const updateSite = useMutation(api.sites.updateSite);
  const engineers = useQuery(api.roles.listActiveEngineers, open ? {} : "skip");
  const isEdit = !!site;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("errors.required")),
        code: z.string().trim().min(1, t("errors.required")),
        regionId: z.string().min(1, t("errors.required")),
        type: z.enum(SITE_TYPES),
        leadEngineerId: z.string(),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: site?.name ?? "",
      code: site?.code ?? "",
      regionId: site?.regionId ?? regionId ?? "",
      type: site?.type ?? "airport",
      leadEngineerId: site?.leadEngineerId ?? NONE_VALUE,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: site?.name ?? "",
        code: site?.code ?? "",
        regionId: site?.regionId ?? regionId ?? "",
        type: site?.type ?? "airport",
        leadEngineerId: site?.leadEngineerId ?? NONE_VALUE,
      });
    }
  }, [open, site, regionId, form]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const leadEngineerId =
        values.leadEngineerId === NONE_VALUE ? undefined : (values.leadEngineerId as Id<"users">);
      if (isEdit) {
        await updateSite({
          siteId: site._id,
          name: values.name,
          code: values.code,
          regionId: values.regionId as Id<"regions">,
          type: values.type,
          leadEngineerId: leadEngineerId ?? null,
        });
        toast.success(t("sites.updated"));
      } else {
        await createSite({
          name: values.name,
          code: values.code,
          regionId: values.regionId as Id<"regions">,
          type: values.type,
          leadEngineerId,
        });
        toast.success(t("sites.created"));
      }
      setOpen(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? t("errors.generic"));
      } else {
        toast.error(t("errors.generic"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="cursor-pointer">
            {t("buttons.edit")}
          </Button>
        ) : (
          <Button className="cursor-pointer">
            <Plus className="size-4" />
            {t("sites.addButton")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("sites.editTitle") : t("sites.createTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("sites.editDescription") : t("sites.createDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sites.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("sites.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sites.code")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("sites.codePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sites.type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SITE_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="cursor-pointer">
                            {t(`sites.type.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="regionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.region")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r._id} value={r._id} className="cursor-pointer">
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leadEngineerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sites.leadEngineer")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE} className="cursor-pointer">
                        {t("sites.leadEngineer.none")}
                      </SelectItem>
                      {engineers?.map(({ user }) => (
                        <SelectItem key={user._id} value={user._id} className="cursor-pointer">
                          {user.name ?? user.email ?? user._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting} className="cursor-pointer">
                {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? t("buttons.save") : t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
