import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import LocaleSwitcher from "@/components/ui/locale-switcher.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.tsx";
import { useAccess } from "@/hooks/use-access.ts";
import { cn } from "@/lib/utils.ts";
import {
  Cog,
  Gauge,
  GraduationCap,
  Loader2,
  LogOut,
  MapPinned,
  Package,
  ShieldCheck,
  Users,
  Plane,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useAuth } from "@/hooks/use-auth.ts";
import type { ComponentType } from "react";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type NavItem = {
  key: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  roles: Array<Doc<"roles">["role"]>;
};

const NAV_ITEMS: NavItem[] = [
  { key: "nav.dashboard", to: "", icon: Gauge, roles: ["super_admin", "site_engineer"] },
  { key: "nav.regions", to: "regions", icon: MapPinned, roles: ["super_admin", "site_engineer"] },
  { key: "nav.engineers", to: "engineers", icon: Users, roles: ["super_admin", "site_engineer"] },
  { key: "nav.licensing", to: "licensing", icon: GraduationCap, roles: ["super_admin", "site_engineer"] },
  { key: "nav.equipment", to: "equipment", icon: Cog, roles: ["super_admin", "site_engineer"] },
  { key: "nav.inventory", to: "inventory", icon: Package, roles: ["super_admin", "site_engineer"] },
  { key: "nav.access", to: "access", icon: ShieldCheck, roles: ["super_admin"] },
];

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AppSidebar({ role }: { role: Doc<"roles">["role"] }) {
  const { t } = useTranslation("common");
  const { lng } = useParams<{ lng: string }>();
  const location = useLocation();
  const { user, signout } = useAuth();

  const basePath = `/${lng}`;
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Plane className="size-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-serif text-sm font-bold tracking-wide">{t("app.name")}</span>
            <span className="text-[11px] text-sidebar-foreground/60">{t("app.tagline")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const to = item.to ? `${basePath}/${item.to}` : basePath;
                const isActive =
                  item.to === ""
                    ? location.pathname === basePath || location.pathname === `${basePath}/`
                    : location.pathname.startsWith(to);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.key)}>
                      <Link to={to}>
                        <item.icon className="size-4" />
                        <span>{t(item.key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-sidebar-accent cursor-pointer"
            >
              <Avatar size="sm">
                <AvatarFallback>{getInitials(user?.profile.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">
                  {user?.profile.name ?? user?.profile.email}
                </span>
                <span className="truncate text-[11px] text-sidebar-foreground/60">
                  {t(`roles.${role}`)}
                </span>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.profile.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={() => void signout()}
            >
              <LogOut className="size-4" />
              {t("buttons.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function AppTopbar() {
  const { t } = useTranslation("common");
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="cursor-pointer" />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm font-medium text-muted-foreground">{t("app.fullName")}</span>
      <div className="flex-1" />
      <LocaleSwitcher />
    </header>
  );
}

function AuthenticatedLayout() {
  const access = useAccess();
  const { t } = useTranslation("common");

  if (access.status === "loading") {
    return (
      <div className="flex h-svh items-center justify-center gap-3">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t("common.loading")}</span>
      </div>
    );
  }

  if (access.status === "pending") {
    return (
      <div className="flex h-svh items-center justify-center px-4">
        <Empty className="max-w-md border rounded-xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldCheck />
            </EmptyMedia>
            <EmptyTitle>{t("pending.title")}</EmptyTitle>
            <EmptyDescription>{t("pending.description")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (access.status !== "granted") {
    return (
      <div className="flex h-svh items-center justify-center gap-3">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar role={access.role.role} />
      <SidebarInset>
        <AppTopbar />
        <div className="flex-1 overflow-auto">
          <Outlet context={{ role: access.role, user: access.user } satisfies LayoutContext} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export type LayoutContext = { role: Doc<"roles">; user: Doc<"users"> };

function SignInScreen() {
  const { t } = useTranslation("common");
  return (
    <div className="relative flex h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-[oklch(0.24_0.05_255)] px-4">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-[0.07]",
          "[background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]",
        )}
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-white/10 bg-card/95 p-8 text-center shadow-2xl backdrop-blur">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Plane className="size-7" />
        </div>
        <div className="space-y-1">
          <h1 className="font-serif text-xl font-bold">{t("app.name")}</h1>
          <p className="text-sm text-muted-foreground">{t("app.fullName")}</p>
          <Badge variant="secondary" className="mt-1">
            {t("app.tagline")}
          </Badge>
        </div>
        <SignInButton className="w-full cursor-pointer" size="lg" signInText={t("buttons.signIn")} />
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <>
      <Authenticated>
        <AuthenticatedLayout />
      </Authenticated>
      <Unauthenticated>
        <SignInScreen />
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-svh items-center justify-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
      </AuthLoading>
    </>
  );
}
