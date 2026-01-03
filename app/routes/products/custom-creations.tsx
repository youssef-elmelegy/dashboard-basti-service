import { useTranslation } from "react-i18next";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export default function CustomCreationsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("customCreations.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("customCreations.description")}
        </p>
      </div>

      <div className="flex-1">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("customCreations.noCustomCreations")}</EmptyTitle>
            <EmptyDescription>
              {t("customCreations.startCustom")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </div>
  );
}
