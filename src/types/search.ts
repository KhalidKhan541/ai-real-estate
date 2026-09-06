import { PropertyType, PropertyStatus, ListingType } from "./property";

export interface SearchFilters {
  query?: string;
  type?: PropertyType[];
  status?: PropertyStatus[];
  listingType?: ListingType[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSqft?: number;
  maxSqft?: number;
  minLotSize?: number;
  maxLotSize?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  features?: string[];
  openHouse?: boolean;
  newConstruction?: boolean;
  pool?: boolean;
  garage?: boolean;
  waterfront?: boolean;
  furnished?: boolean;
}

export interface SearchSort {
  field: "price" | "date" | "sqft" | "bedrooms" | "distance" | "relevance";
  order: "asc" | "desc";
}

export interface SearchQuery {
  filters: SearchFilters;
  sort?: SearchSort;
  page?: number;
  limit?: number;
  view?: "list" | "map" | "grid";
}

export interface SearchResult {
  properties: SearchPropertyResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: SearchFilters;
  sort: SearchSort;
  duration: number;
}

export interface SearchPropertyResult {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  type: PropertyType;
  status: PropertyStatus;
  listingType: ListingType;
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  daysOnMarket: number;
  score: number;
}

export interface SearchSuggestion {
  text: string;
  type: "location" | "agent" | "property" | "keyword";
  imageUrl?: string;
  id?: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: SearchQuery;
  notifyOnMatch: boolean;
  createdAt: string;
}

export interface SearchAnalytics {
  query: string;
  resultCount: number;
  filters: SearchFilters;
  timestamp: string;
  userId?: string;
}

export interface MapSearchResult {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  clusters: MapCluster[];
  properties: SearchPropertyResult[];
}

export interface MapCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  avgPrice: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface AutocompleteResult {
  predictions: AutocompletePrediction[];
  status: string;
}

export interface AutocompletePrediction {
  description: string;
  placeId: string;
  types: string[];
  structuredFormatting?: {
    mainText: string;
    secondaryText: string;
  };
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
  recentSearches: SearchHistory[];
  popularSearches: string[];
}

export default SearchQuery;
