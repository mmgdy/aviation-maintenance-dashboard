import { useMemo, useState } from "react";
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
import { UserPlus, Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const NONE_VALUE = "none";

export default function InviteEngineerDialog() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const inviteEngineer = useMutation(api.roles.inviteEngineer);
  const sites = useQuery(api.sites.listSites, open ? {} : "skip");

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("errors.required")),
        email: z.string().trim().email(t("errors.invalid_email")),
        role: z.enum(["super_admin", "site_engineer"]),
        department: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        siteId: z.string(),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      role: "site_engineer",
      department: "",
      phone: "",
      siteId: NONE_VALUE,
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await inviteEngineer({
        name: values.name,
        email: values.email,
        role: values.role,
        department: values.department || undefined,
        phone: values.phone || undefined,
        siteId: values.siteId === NONE_VALUE ? undefined : (values.siteId as Id<"sites">),
      });
      toast.success(t("invite.success"));
      form.reset({
        name: "",
        email: "",
        role: "site_engineer",
        department: "",
        phone: "",
        siteId: NONE_VALUE,
      });
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
        <Button className="cursor-pointer">
          <UserPlus className="size-4" />
          {t("invite.addButton")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("invite.title")}</DialogTitle>
          <DialogDescription>{t("invite.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.email")}</FormLabel>
                  <FormControl>
                    <Input placeholder="example@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.role")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="site_engineer" className="cursor-pointer">
                          {t("roles.site_engineer")}
                        </SelectItem>
                        <SelectItem value="super_admin" className="cursor-pointer">
                          {t("roles.super_admin")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.department")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Mechanical" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.phone")}</FormLabel>
                  <FormControl>
                    <Input placeholder="+20 100 000 0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="siteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.site")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE} className="cursor-pointer">
                        {t("engineers.unassigned")}
                      </SelectItem>
                      {sites?.map((site) => (
                        <SelectItem key={site._id} value={site._id} className="cursor-pointer">
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="cursor-pointer"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
