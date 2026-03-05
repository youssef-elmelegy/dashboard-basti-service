import { apiClient } from "@/lib/api-client";
import type { ProductType } from "../types";

type RegionalPricingBody =
  | { regionId: string; price: string; featuredCakeId: string }
  | { regionId: string; price: string; addonId: string }
  | { regionId: string; price: string; flavorId: string }
  | { regionId: string; price: string; shapeId: string }
  | { regionId: string; price: string; decorationId: string }
  | {
      regionId: string;
      price: string;
      sweetId: string;
      sizesPrices?: Record<string, string>;
    }
  | { regionId: string; price: string; predesignedCakeId: string };

export function getPricingEndpointAndBody(
  productType: ProductType,
  regionId: string,
  productId: string,
  regionPrice: number,
  sizePrices?: Record<string, number>,
): { endpoint: string; body: RegionalPricingBody } {
  const baseBody = {
    regionId,
    price: regionPrice.toFixed(2),
  };

  switch (productType) {
    case "featured-cake":
      return {
        endpoint: "/featured-cakes/region-pricing",
        body: { ...baseBody, featuredCakeId: productId },
      };
    case "addon":
      return {
        endpoint: "/addons/region-pricing",
        body: { ...baseBody, addonId: productId },
      };
    case "flavor":
      return {
        endpoint: "/custom-cakes/flavors/region-pricing",
        body: { ...baseBody, flavorId: productId },
      };
    case "shape":
      return {
        endpoint: "/custom-cakes/shapes/region-pricing",
        body: { ...baseBody, shapeId: productId },
      };
    case "decoration":
      return {
        endpoint: "/custom-cakes/decorations/region-pricing",
        body: { ...baseBody, decorationId: productId },
      };
    case "sweet": {
      const sizesPricesStr: Record<string, string> = {};
      if (sizePrices && Object.keys(sizePrices).length > 0) {
        Object.entries(sizePrices).forEach(([sizeName, price]) => {
          sizesPricesStr[sizeName] = price.toFixed(2);
        });
      }
      const body: RegionalPricingBody = {
        ...baseBody,
        sweetId: productId,
        ...(Object.keys(sizesPricesStr).length > 0 && {
          sizesPrices: sizesPricesStr,
        }),
      };
      return {
        endpoint: "/sweets/region-pricing",
        body,
      };
    }
    case "predesigned-cake":
      return {
        endpoint: "/custom-cakes/predesigned-cakes/region-pricing",
        body: { ...baseBody, predesignedCakeId: productId },
      };
  }
}

export async function submitRegionalPricing(
  productType: ProductType,
  regionId: string,
  productId: string,
  regionPrice: number,
  sizePrices?: Record<string, number>,
): Promise<void> {
  console.log("submitRegionalPricing called with productType:", productType);
  const { endpoint, body } = getPricingEndpointAndBody(
    productType,
    regionId,
    productId,
    regionPrice,
    sizePrices,
  );
  console.log("Submitting to endpoint:", endpoint, "with body:", body);
  await apiClient.post(endpoint, body);
}
