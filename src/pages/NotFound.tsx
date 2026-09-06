import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

export default function NotFound() {
  const location = useLocation();
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("common");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold">{t("notFound.title")}</h2>
        </div>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          {t("notFound.description")}
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link to={`/${lng ?? ""}`}>{t("buttons.returnHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
