import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchProductsBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchProductsBar({
  searchQuery,
  onSearchChange,
}: SearchProductsBarProps) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 p-4 rounded-lg border">
      <Search className="w-5 h-5 text-muted-foreground" />
      <Input
        placeholder="Search products by name or description..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="bg-background border-0 focus-visible:ring-0"
      />
    </div>
  );
}
