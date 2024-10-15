import type { InventoryItem } from "./inventory.type";
import type { MediaInput } from "./media.type";
import type { MetafieldInput } from "./metafiled.type";

export type userErrors = {
  field: string[];
  message: string;
};

export interface ProductNode {
  node: ProductVariant;
}

export interface ProductResponse {
  products?: ProductInput[];
  product?: ProductInput;
  variants?: ProductVariant[];
  userErrors?: string[];
}

export interface ProductOptionResponse {
  userErrors: string[];
  product: {
    id: string;
    options: {
      id: string;
      name: string;
      values: string[];
      position: number;
      optionValues: {
        name: string;
        hasVariants: boolean;
      }[];
    }[];
    variants: {
      id: string;
      title: string;
      selectedOptions: {
        name: string;
        value: string;
      }[];
    };
  };
}

export interface ProductInput {
  id?: string;
  productId?: string;
  title: string;
  category?: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  productOptions?: ProductOptionInput[];
  options?: ProductOptionInput[];
  descriptionHtml?: string;
  metafields?: MetafieldInput[];
  media?: MediaInput[];
  handle?: string;
  vendor?: string;
  productPublications?: ProductPublicationInput[];
  productType?: string;
}

export interface ProductPublicationInput {
  publicationId: string;
}

export interface ProductOptionInput {
  id?: string;
  name: string;
  values: ProductOptionInputValue[];
  optionValues?: ProductOptionInputValue[];
}

export interface ProductOptionInputValue {
  id?: string;
  name: string;
  position?: number;
  values?: string[];
  optionName?: string;
}

export interface ProductVariantInput {
  productId: string;
  media?: MediaInput[];
  variants?: ProductVariant[];
  strategy?: "DEFAULT" | "REMOVE_STANDALONE_VARIANT";
}

export interface ProductVariant {
  id?: string;
  compareAtPrice: string;
  barcode: string;
  price: string;
  sku?: string;
  mediaSrc: string;
  metafields?: MetafieldInput[];
  optionValues?: ProductOptionInputValue[];
  inventoryPolicy?: "DENY" | "CONTINUE";
  inventoryItem?: InventoryItem;
  inventoryQuantities?: { availableQuantity: number; locationId: string }[];
}
