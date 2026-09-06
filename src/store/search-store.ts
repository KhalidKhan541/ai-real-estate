import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { SearchFilters, SearchSort, SearchPropertyResult } from "@/types/search";

export interface SearchState {
  query: string;
  filters: SearchFilters;
  sort: SearchSort;
  results: SearchPropertyResult[];
  suggestions: string[];
  recentSearches: string[];
  savedSearches: SavedSearchItem[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  currentPage: number;
  pageSize: number;
  searchHistory: SearchHistoryItem[];
  mapBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  viewMode: "list" | "map" | "grid";
  priceRange: [number, number];
  bedroomRange: [number, number];
  bathroomRange: [number, number];
  squareFeetRange: [number, number];
}

export interface SavedSearchItem {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  createdAt: string;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: SearchSort) => void;
  setResults: (results: SearchPropertyResult[], total: number) => void;
  setSuggestions: (suggestions: string[]) => void;
  addRecentSearch: (query: string, filters: SearchFilters, resultCount: number) => void;
  clearRecentSearches: () => void;
  saveSearch: (name: string) => void;
  removeSavedSearch: (id: string) => void;
  loadSavedSearch: (search: SavedSearchItem) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setMapBounds: (bounds: SearchState["mapBounds"]) => void;
  setViewMode: (mode: "list" | "map" | "grid") => void;
  setPriceRange: (range: [number, number]) => void;
  setBedroomRange: (range: [number, number]) => void;
  setBathroomRange: (range: [number, number]) => void;
  setSquareFeetRange: (range: [number, number]) => void;
  resetSearch: () => void;
}

const defaultFilters: SearchFilters = {};

const defaultSort: SearchSort = {
  field: "relevance",
  order: "desc",
};

const initialState: SearchState = {
  query: "",
  filters: defaultFilters,
  sort: defaultSort,
  results: [],
  suggestions: [],
  recentSearches: [],
  savedSearches: [],
  isLoading: false,
  error: null,
  totalResults: 0,
  currentPage: 1,
  pageSize: 12,
  searchHistory: [],
  mapBounds: null,
  viewMode: "list",
  priceRange: [0, 10000000],
  bedroomRange: [0, 10],
  bathroomRange: [0, 10],
  squareFeetRange: [0, 20000],
};

export const useSearchStore = create<SearchState & SearchActions>()(
  immer((set, get) => ({
    ...initialState,

    setQuery: (query) =>
      set((state) => {
        state.query = query;
        state.currentPage = 1;
      }),

    setFilters: (filters) =>
      set((state) => {
        state.filters = { ...state.filters, ...filters };
        state.currentPage = 1;
      }),

    clearFilters: () =>
      set((state) => {
        state.filters = defaultFilters;
        state.priceRange = [0, 10000000];
        state.bedroomRange = [0, 10];
        state.bathroomRange = [0, 10];
        state.squareFeetRange = [0, 20000];
        state.currentPage = 1;
      }),

    setSort: (sort) =>
      set((state) => {
        state.sort = sort;
        state.currentPage = 1;
      }),

    setResults: (results, total) =>
      set((state) => {
        state.results = results;
        state.totalResults = total;
        state.isLoading = false;
        state.error = null;
      }),

    setSuggestions: (suggestions) =>
      set((state) => {
        state.suggestions = suggestions;
      }),

    addRecentSearch: (query, filters, resultCount) =>
      set((state) => {
        const historyItem: SearchHistoryItem = {
          id: `search-${Date.now()}`,
          query,
          filters,
          resultCount,
          createdAt: new Date().toISOString(),
        };

        state.searchHistory.unshift(historyItem);

        if (state.searchHistory.length > 20) {
          state.searchHistory.pop();
        }

        if (!state.recentSearches.includes(query)) {
          state.recentSearches.unshift(query);
          if (state.recentSearches.length > 10) {
            state.recentSearches.pop();
          }
        }
      }),

    clearRecentSearches: () =>
      set((state) => {
        state.recentSearches = [];
        state.searchHistory = [];
      }),

    saveSearch: (name) =>
      set((state) => {
        const savedSearch: SavedSearchItem = {
          id: `saved-${Date.now()}`,
          name,
          query: state.query,
          filters: state.filters,
          createdAt: new Date().toISOString(),
        };
        state.savedSearches.push(savedSearch);
      }),

    removeSavedSearch: (id) =>
      set((state) => {
        state.savedSearches = state.savedSearches.filter((s) => s.id !== id);
      }),

    loadSavedSearch: (search) =>
      set((state) => {
        state.query = search.query;
        state.filters = search.filters;
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

    setPage: (page) =>
      set((state) => {
        state.currentPage = page;
      }),

    setMapBounds: (bounds) =>
      set((state) => {
        state.mapBounds = bounds;
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
      }),

    setPriceRange: (range) =>
      set((state) => {
        state.priceRange = range;
        state.filters.minPrice = range[0] || undefined;
        state.filters.maxPrice = range[1] || undefined;
        state.currentPage = 1;
      }),

    setBedroomRange: (range) =>
      set((state) => {
        state.bedroomRange = range;
        state.filters.minBedrooms = range[0] || undefined;
        state.filters.maxBedrooms = range[1] || undefined;
        state.currentPage = 1;
      }),

    setBathroomRange: (range) =>
      set((state) => {
        state.bathroomRange = range;
        state.filters.minBathrooms = range[0] || undefined;
        state.filters.maxBathrooms = range[1] || undefined;
        state.currentPage = 1;
      }),

    setSquareFeetRange: (range) =>
      set((state) => {
        state.squareFeetRange = range;
        state.filters.minSqft = range[0] || undefined;
        state.filters.maxSqft = range[1] || undefined;
        state.currentPage = 1;
      }),

    resetSearch: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);

export default useSearchStore;
