"use client";

import { useState } from "react";
import { Search as SearchIcon, Sparkles, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchResults } from "@/components/search/search-results";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceMin: "",
    priceMax: "",
    beds: "",
    baths: "",
    propertyType: "",
    sqftMin: "",
    sqftMax: "",
  });

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advanced Search</h1>
        <p className="text-gray-600">Find your perfect property with AI-powered search</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Describe your dream home... (e.g., '3 bedroom house near downtown with a pool')"
                className="pl-11 text-lg py-6"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="px-6">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </Button>
            <Button className="px-6">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <SearchFilters filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} />
      )}

      {/* Results */}
      <SearchResults query={query} filters={filters} />
    </div>
  );
}
