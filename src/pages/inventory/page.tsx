import PageHeader from "@/components/layout/page-header.tsx";
import ComingSoon from "@/components/layout/coming-soon.tsx";
import { useTranslation } from "react-i18next";

export default function InventoryPage() {
  const { t } = useTranslation("common");
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t("nav.inventory")} />
      <ComingSoon title={t("nav.inventory")} />
    </div>
  );
}
