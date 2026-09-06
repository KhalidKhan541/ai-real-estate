export type PropertyType = "house" | "apartment" | "condo" | "townhouse" | "land" | "commercial";

export type PropertyStatus = "active" | "pending" | "sold" | "rented" | "off-market" | "draft";

export type ListingType = "sale" | "rent" | "lease";

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
  width?: number;
  height?: number;
}

export interface PropertyFeature {
  name: string;
  value: string | boolean | number;
  category?: string;
}

export interface PropertyAddress {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  formatted: string;
}

export interface PropertyGeoLocation {
  latitude: number;
  longitude: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  listingType: ListingType;
  price: number;
  pricePerSqFt?: number;
  bedrooms: number;
  bathrooms: number;
  halfBathrooms?: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt: number;
  address: PropertyAddress;
  location: PropertyGeoLocation;
  images: PropertyImage[];
  features: PropertyFeature[];
  agentId: string;
  ownerId?: string;
  views: number;
  favorites: number;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyListingsQuery {
  page?: number;
  limit?: number;
  type?: PropertyType;
  status?: PropertyStatus;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSqft?: number;
  maxSqft?: number;
  city?: string;
  state?: string;
  zip?: string;
  features?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PropertyListingsResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PropertyDetails extends Property {
  openHouse?: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
  virtualTour?: string;
  documents?: PropertyDocument[];
  comparableProperties?: Property[];
  priceHistory?: PriceHistoryEntry[];
  taxHistory?: TaxHistoryEntry[];
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface PriceHistoryEntry {
  date: string;
  price: number;
  event: "listed" | "reduced" | "increased" | "sold";
}

export interface TaxHistoryEntry {
  year: number;
  taxAmount: number;
  assessedValue: number;
}

export interface CreatePropertyInput {
  title: string;
  description: string;
  type: PropertyType;
  listingType: ListingType;
  price: number;
  bedrooms: number;
  bathrooms: number;
  halfBathrooms?: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt: number;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  features?: Array<{ name: string; value: string | boolean | number }>;
}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {
  status?: PropertyStatus;
}

export default Property;
