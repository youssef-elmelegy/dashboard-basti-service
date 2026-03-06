import { useTranslation } from "react-i18next";
import { SelectedProductsDataTable } from "@/components/SelectedProductsDataTable";
import { selectedProductsColumns } from "@/components/SelectedProductsColumns";

type SelectedProductItem = {
  id: string;
  regionId: string;
  regionName: string;
  type: "cake" | "sweet";
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  selectedSizes: Array<{ name: string; price: number }>;
  addedAt: Date;
};

interface SelectedProductsTableProps {
  isLoading: boolean;
  data: SelectedProductItem[];
  onRemoveProduct: (id: string) => void;
  onEditProduct: (item: SelectedProductItem) => void;
}

export function SelectedProductsTable({
  isLoading,
  data,
  onRemoveProduct,
  onEditProduct,
}: SelectedProductsTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 border rounded-lg bg-muted/50">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <span className="text-sm text-muted-foreground ml-2">
          {t("regions.tableLoading")}
        </span>
      </div>
    );
  }

  return (
    <SelectedProductsDataTable
      columns={selectedProductsColumns(onRemoveProduct, onEditProduct, t)}
      data={data}
    />
  );
}
