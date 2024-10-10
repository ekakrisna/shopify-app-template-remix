export interface InventoryItem {
  cost?: string;
  measurement: {
    weight: {
      unit: "GRAMS" | "KILOGRAMS" | "OUNCES" | "POUNDS";
      value: number;
    };
  };
  countryCodeOfOrigin: string;
  requiresShipping: boolean;
  sku: string;
  tracked: boolean;
}
