import { Badge } from "@/components/ui/badge";
import type { ReadyCake, Sweet } from "@/data/products";

interface SearchProductsDropdownProps {
  filteredCakes: ReadyCake[];
  filteredSweets: Sweet[];
  searchQuery: string;
  onSelectCake: (cake: ReadyCake) => void;
  onSelectSweet: (sweet: Sweet) => void;
  onClose: () => void;
}

export function SearchProductsDropdown({
  filteredCakes,
  filteredSweets,
  searchQuery,
  onSelectCake,
  onSelectSweet,
  onClose,
}: SearchProductsDropdownProps) {
  const hasResults = filteredCakes.length > 0 || filteredSweets.length > 0;

  if (!searchQuery || !hasResults) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {/* Cakes Section */}
      {filteredCakes.length > 0 && (
        <div className="border-b border-slate-700">
          <div className="px-4 py-2 bg-slate-800 text-white font-semibold text-sm sticky top-0">
            Ready Cakes
          </div>
          {filteredCakes.map((cake) => (
            <button
              key={cake.id}
              onClick={() => {
                onSelectCake(cake);
                onClose();
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-700 last:border-b-0 flex items-start gap-3"
            >
              <img
                src={cake.image}
                alt={cake.name}
                className="w-12 h-12 rounded object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{cake.name}</p>
                <p className="text-slate-400 text-sm line-clamp-2">
                  {cake.description}
                </p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {cake.sizes.slice(0, 2).map((size) => (
                    <Badge
                      key={size.name}
                      variant="secondary"
                      className="text-xs"
                    >
                      {size.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sweets Section */}
      {filteredSweets.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-slate-800 text-white font-semibold text-sm sticky top-0">
            Sweets
          </div>
          {filteredSweets.map((sweet) => (
            <button
              key={sweet.id}
              onClick={() => {
                onSelectSweet(sweet);
                onClose();
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-700 last:border-b-0 flex items-start gap-3"
            >
              <img
                src={sweet.image}
                alt={sweet.name}
                className="w-12 h-12 rounded object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{sweet.name}</p>
                <p className="text-slate-400 text-sm line-clamp-2">
                  {sweet.description}
                </p>
                <p className="text-slate-300 text-sm mt-1">${sweet.price}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
