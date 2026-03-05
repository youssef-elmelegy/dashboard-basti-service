import { Badge } from "@/components/ui/badge";
import type { SmallCake, AddOn } from "@/data/products";

interface SearchProductsDropdownProps {
  filteredCakes: SmallCake[];
  filteredSweets: AddOn[];
  filteredAddOns: AddOn[];
  searchQuery: string;
  onSelectCake: (cake: SmallCake) => void;
  onSelectSweet: (sweet: AddOn) => void;
  onSelectAddOn: (addOn: AddOn) => void;
  onClose: () => void;
}

export function SearchProductsDropdown({
  filteredCakes,
  filteredSweets,
  filteredAddOns,
  searchQuery,
  onSelectCake,
  onSelectSweet,
  onSelectAddOn,
  onClose,
}: SearchProductsDropdownProps) {
  const hasResults =
    filteredCakes.length > 0 ||
    filteredSweets.length > 0 ||
    filteredAddOns.length > 0;

  if (!searchQuery || !hasResults) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {/* Small Cakes Section */}
      {filteredCakes.length > 0 && (
        <div className="border-b border-slate-700">
          <div className="px-4 py-2 bg-slate-800 text-white font-semibold text-sm sticky top-0 z-10">
            Small Cakes
          </div>
          <div className="space-y-0">
            {filteredCakes.map((cake) => (
              <button
                key={cake.id}
                onClick={() => {
                  onSelectCake(cake);
                  onClose();
                }}
                className="w-full text-left px-4 py-4 hover:bg-slate-800 transition-colors border-b border-slate-700 last:border-b-0 flex items-start gap-3"
              >
                <img
                  src={cake.images?.[0]}
                  alt={cake.name}
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{cake.name}</p>
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {cake.description}
                  </p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {cake.sizes.slice(0, 2).map((size) => (
                      <Badge
                        key={size.size}
                        variant="secondary"
                        className="text-xs"
                      >
                        {size.size}
                      </Badge>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sweets Section */}
      {filteredSweets.length > 0 && (
        <div className="border-b border-slate-700">
          <div className="px-4 py-3 bg-slate-800 text-white font-semibold text-sm sticky top-0 z-10">
            Sweets
          </div>
          <div className="space-y-0">
            {filteredSweets.map((sweet) => (
              <button
                key={sweet.id}
                onClick={() => {
                  onSelectSweet(sweet);
                  onClose();
                }}
                className="w-full text-left px-4 py-4 hover:bg-slate-800 transition-colors border-b border-slate-700 last:border-b-0 flex items-start gap-3"
              >
                <img
                  src={sweet.images?.[0]}
                  alt={sweet.name}
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {sweet.name}
                  </p>
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {sweet.description}
                  </p>
                  <p className="text-slate-300 text-sm mt-2 font-medium">
                    ${sweet.price}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons Section */}
      {filteredAddOns.length > 0 && (
        <div>
          <div className="px-4 py-3 bg-slate-800 text-white font-semibold text-sm sticky top-0 z-10">
            Add-ons
          </div>
          <div className="space-y-0">
            {filteredAddOns.map((addOn) => (
              <button
                key={addOn.id}
                onClick={() => {
                  onSelectAddOn(addOn);
                  onClose();
                }}
                className="w-full text-left px-4 py-4 hover:bg-slate-800 transition-colors border-b border-slate-700 last:border-b-0 flex items-start gap-3"
              >
                <img
                  src={addOn.images?.[0]}
                  alt={addOn.name}
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {addOn.name}
                  </p>
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {addOn.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {addOn.category}
                    </Badge>
                    <p className="text-slate-300 text-sm font-medium">
                      ${addOn.price}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
