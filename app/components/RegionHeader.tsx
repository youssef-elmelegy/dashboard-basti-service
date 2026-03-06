import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface RegionHeaderProps {
  regionName: string;
}

export function RegionHeader({ regionName }: RegionHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/management/regions"
                className="cursor-pointer"
              >
                {t("regions.title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{regionName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{regionName}</h1>
          <p className="text-muted-foreground mt-2">
            {t("regions.viewSelectProducts")}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => navigate("/management/regions")}
        className="gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        {t("regions.backToRegions")}
      </Button>
    </div>
  );
}
