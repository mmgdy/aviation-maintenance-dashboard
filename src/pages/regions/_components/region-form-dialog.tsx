import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "convex/react";
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
import { Plus, Loader2 } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

export default function RegionFormDialog({ region }: { region?: Doc<"regions"> }) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const createRegion = useMutation(api.regions.createRegion);
  const updateRegion = useMutation(api.regions.updateRegion);
  const isEdit = !!region;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("errors.required")),
        code: z.string().trim().min(1, t("errors.required")),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: region?.name ?? "", code: region?.code ?? "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: region?.name ?? "", code: region?.code ?? "" });
    }
  }, [open, region, form]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      if (isEdit) {
        await updateRegion({ regionId: region._id, name: values.name, code: values.code });
        toast.success(t("regions.updated"));
      } else {
        await createRegion({ name: values.name, code: values.code });
        toast.success(t("regions.created"));
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
            {t("regions.addButton")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("regions.editTitle") : t("regions.createTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("regions.editDescription") : t("regions.createDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("regions.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("regions.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("regions.code")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("regions.codePlaceholder")} {...field} />
                  </FormControl>
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
