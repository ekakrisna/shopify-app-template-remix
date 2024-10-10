export interface LocationNode {
  node: Location;
}

export interface LocationResponse {
  locations: Location[];
}

export interface Location {
  id: string;
  name: string;
  address: Address;
}

export interface Address {
  formatted: string[];
}
