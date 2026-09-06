import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Property, PropertyType, PropertyStatus, ListingType } from "@/types/property";

export interface PropertyFilters {
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
  city?: string;
  state?: string;
  features?: string[];
}

export interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  favorites: string[];
  recentViews: string[];
  filters: PropertyFilters;
  isLoading: boolean;
  error: string | null;
  totalProperties: number;
  currentPage: number;
  pageSize: number;
  viewMode: "list" | "grid" | "map";
  sortBy: "price" | "date" | "sqft" | "relevance";
  sortOrder: "asc" | "desc";
}

export interface PropertyActions {
  setProperties: (properties: Property[]) => void;
  addProperty: (property: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  removeProperty: (id: string) => void;
  selectProperty: (property: Property | null) => void;
  toggleFavorite: (propertyId: string) => void;
  addRecentView: (propertyId: string) => void;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (page: number, total: number) => void;
  setViewMode: (mode: "list" | "grid" | "map") => void;
  setSorting: (sortBy: PropertyState["sortBy"], sortOrder: "asc" | "desc") => void;
  getPropertyById: (id: string) => Property | undefined;
  getFilteredProperties: () => Property[];
}

const defaultFilters: PropertyFilters = {
  type: [],
  status: ["active"],
  listingType: [],
  minPrice: undefined,
  maxPrice: undefined,
  minBedrooms: undefined,
  maxBedrooms: undefined,
  minBathrooms: undefined,
  maxBathrooms: undefined,
  minSqft: undefined,
  maxSqft: undefined,
  city: undefined,
  state: undefined,
  features: [],
};

const initialState: PropertyState = {
  properties: [],
  selectedProperty: null,
  favorites: [],
  recentViews: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,
  totalProperties: 0,
  currentPage: 1,
  pageSize: 12,
  viewMode: "grid",
  sortBy: "relevance",
  sortOrder: "desc",
};

export const usePropertyStore = create<PropertyState & PropertyActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setProperties: (properties) =>
        set((state) => {
          state.properties = properties;
          state.totalProperties = properties.length;
        }),

      addProperty: (property) =>
        set((state) => {
          state.properties.unshift(property);
          state.totalProperties++;
        }),

      updateProperty: (id, updates) =>
        set((state) => {
          const index = state.properties.findIndex((p) => p.id === id);
          if (index > -1) {
            Object.assign(state.properties[index], updates);
          }
          if (state.selectedProperty?.id === id) {
            Object.assign(state.selectedProperty, updates);
          }
        }),

      removeProperty: (id) =>
        set((state) => {
          state.properties = state.properties.filter((p) => p.id !== id);
          state.totalProperties--;
          if (state.selectedProperty?.id === id) {
            state.selectedProperty = null;
          }
        }),

      selectProperty: (property) =>
        set((state) => {
          state.selectedProperty = property;
        }),

      toggleFavorite: (propertyId) =>
        set((state) => {
          const index = state.favorites.indexOf(propertyId);
          if (index > -1) {
            state.favorites.splice(index, 1);
          } else {
            state.favorites.push(propertyId);
          }
        }),

      addRecentView: (propertyId) =>
        set((state) => {
          const existingIndex = state.recentViews.indexOf(propertyId);
          if (existingIndex > -1) {
            state.recentViews.splice(existingIndex, 1);
          }
          state.recentViews.unshift(propertyId);
          if (state.recentViews.length > 50) {
            state.recentViews.pop();
          }
        }),

      setFilters: (filters) =>
        set((state) => {
          state.filters = { ...state.filters, ...filters };
          state.currentPage = 1;
        }),

      clearFilters: () =>
        set((state) => {
          state.filters = defaultFilters;
          state.currentPage = 1;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
          state.isLoading = false;
        }),

      setPagination: (page, total) =>
        set((state) => {
          state.currentPage = page;
          state.totalProperties = total;
        }),

      setViewMode: (mode) =>
        set((state) => {
          state.viewMode = mode;
        }),

      setSorting: (sortBy, sortOrder) =>
        set((state) => {
          state.sortBy = sortBy;
          state.sortOrder = sortOrder;
        }),

      getPropertyById: (id) => {
        return get().properties.find((p) => p.id === id);
      },

      getFilteredProperties: () => {
        const state = get();
        let filtered = [...state.properties];

        if (state.filters.type && state.filters.type.length > 0) {
          filtered = filtered.filter((p) => state.filters.type!.includes(p.type));
        }

        if (state.filters.status && state.filters.status.length > 0) {
          filtered = filtered.filter((p) => state.filters.status!.includes(p.status));
        }

        if (state.filters.listingType && state.filters.listingType.length > 0) {
          filtered = filtered.filter((p) => state.filters.listingType!.includes(p.listingType));
        }

        if (state.filters.minPrice !== undefined) {
          filtered = filtered.filter((p) => p.price >= state.filters.minPrice!);
        }
        if (state.filters.maxPrice !== undefined) {
          filtered = filtered.filter((p) => p.price <= state.filters.maxPrice!);
        }

        if (state.filters.minBedrooms !== undefined) {
          filtered = filtered.filter((p) => p.bedrooms >= state.filters.minBedrooms!);
        }
        if (state.filters.maxBedrooms !== undefined) {
          filtered = filtered.filter((p) => p.bedrooms <= state.filters.maxBedrooms!);
        }

        if (state.filters.minBathrooms !== undefined) {
          filtered = filtered.filter((p) => p.bathrooms >= state.filters.minBathrooms!);
        }
        if (state.filters.maxBathrooms !== undefined) {
          filtered = filtered.filter((p) => p.bathrooms <= state.filters.maxBathrooms!);
        }

        if (state.filters.minSqft !== undefined) {
          filtered = filtered.filter((p) => p.squareFeet >= state.filters.minSqft!);
        }
        if (state.filters.maxSqft !== undefined) {
          filtered = filtered.filter((p) => p.squareFeet <= state.filters.maxSqft!);
        }

        if (state.filters.city) {
          filtered = filtered.filter(
            (p) => p.address.city.toLowerCase().includes(state.filters.city!.toLowerCase())
          );
        }
        if (state.filters.state) {
          filtered = filtered.filter(
            (p) => p.address.state.toLowerCase() === state.filters.state!.toLowerCase()
          );
        }

        filtered.sort((a, b) => {
          let comparison = 0;
          switch (state.sortBy) {
            case "price":
              comparison = a.price - b.price;
              break;
            case "date":
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
            case "sqft":
              comparison = a.squareFeet - b.squareFeet;
              break;
            case "relevance":
              comparison = (b.score || 0) - (a.score || 0);
              break;
          }
          return state.sortOrder === "desc" ? -comparison : comparison;
        });

        return filtered;
      },
    })),
    {
      name: "are-property-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        recentViews: state.recentViews,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default usePropertyStore;
