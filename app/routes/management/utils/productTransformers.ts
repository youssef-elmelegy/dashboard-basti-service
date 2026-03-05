import type { SmallCake, AddOn } from "@/data/products";
import type { SelectedProductItem, ProductData } from "../types";

export function convertStoreProductToProductData(
  product: SmallCake | AddOn,
): ProductData {
  const baseData: ProductData = {
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
  };

  if ("mainPrice" in product) {
    return {
      ...baseData,
      mainPrice: product.mainPrice,
      sizes: product.sizes.map((s) => ({
        name: s.size,
        price: s.price,
      })),
    };
  } else {
    return {
      ...baseData,
      price: product.price,
      category: product.category,
    };
  }
}

export function transformRegionalProductsToItems(
  regionalProducts: ProductData[],
  regionId: string,
  regionName: string,
): SelectedProductItem[] {
  return regionalProducts.map((product) => {
    const productType =
      (product as unknown as { type?: string }).type || "sweet";
    const itemType =
      productType === "featured-cake" || productType === "predesigned-cake"
        ? "cake"
        : "sweet";
    const mappedProductType = mapApiTypeToProductType(productType);

    // Extract image based on product type
    let productImage = "";
    if ((product as unknown as { thumbnailUrl?: string }).thumbnailUrl) {
      productImage = (product as unknown as { thumbnailUrl: string })
        .thumbnailUrl;
    } else if (product.images?.[0]) {
      productImage = product.images[0];
    } else if ((product as unknown as { flavorUrl?: string }).flavorUrl) {
      productImage = (product as unknown as { flavorUrl: string }).flavorUrl;
    } else if (
      (product as unknown as { decorationUrl?: string }).decorationUrl
    ) {
      productImage = (product as unknown as { decorationUrl: string })
        .decorationUrl;
    } else if ((product as unknown as { shapeUrl?: string }).shapeUrl) {
      productImage = (product as unknown as { shapeUrl: string }).shapeUrl;
    }

    // Extract name based on product type
    const productName = product.name || product.title || "";

    return {
      id: `regional-${product.id}`,
      regionId,
      regionName,
      type: itemType,
      productType: mappedProductType,
      productId: product.id,
      productName,
      productImage,
      basePrice: product.price ? Number(product.price) : 0,
      selectedSizes: product.sizesPrices
        ? Object.entries(product.sizesPrices).map(([name, price]) => ({
            name,
            price: Number(price),
          }))
        : [],
      addedAt: product.createdAt ? new Date(product.createdAt) : new Date(),
    };
  });
}

export function mapApiTypeToProductType(
  apiType: string,
):
  | "featured-cake"
  | "addon"
  | "sweet"
  | "flavor"
  | "shape"
  | "decoration"
  | "predesigned-cake" {
  const typeMap: Record<
    string,
    | "featured-cake"
    | "addon"
    | "sweet"
    | "flavor"
    | "shape"
    | "decoration"
    | "predesigned-cake"
  > = {
    "featured-cakes": "featured-cake",
    addons: "addon",
    sweets: "sweet",
    flavors: "flavor",
    shapes: "shape",
    decorations: "decoration",
    "predesigned-cakes": "predesigned-cake",
  };

  return (
    typeMap[apiType] ||
    ("sweet" as
      | "featured-cake"
      | "addon"
      | "sweet"
      | "flavor"
      | "shape"
      | "decoration"
      | "predesigned-cake")
  );
}
