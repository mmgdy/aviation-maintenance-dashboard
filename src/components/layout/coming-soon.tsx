import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty.tsx";
import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Construction />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{t("comingSoon.description", { ns: "common" })}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent />
      </Empty>
    </div>
  );
}
