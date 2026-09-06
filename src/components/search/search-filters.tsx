"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SearchFiltersProps {
  filters: {
    priceMin: string;
    priceMax: string;
    beds: string;
    baths: string;
    propertyType: string;
    sqftMin: string;
    sqftMax: string;
  };
  setFilters: (filters: any) => void;
  onClose: () => void;
}

const propertyTypes = ["House", "Apartment", "Condo", "Villa", "Townhouse", "Land"];
const bedOptions = ["1+", "2+", "3+", "4+", "5+"];
const bathOptions = ["1+", "2+", "3+", "4+"];

export function SearchFilters({ filters, setFilters, onClose }: SearchFiltersProps) {
  return (
    <div className="bg-white border rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Search Filters</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Price Range */}
        <div className="space-y-3">
          <Label>Price Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.priceMin}
              onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.priceMax}
              onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div className="space-y-3">
          <Label>Bedrooms</Label>
          <div className="flex flex-wrap gap-2">
            {bedOptions.map((option) => (
              <button
                key={option}
                onClick={() => setFilters({ ...filters, beds: filters.beds === option ? "" : option })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filters.beds === option
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Bathrooms */}
        <div className="space-y-3">
          <Label>Bathrooms</Label>
          <div className="flex flex-wrap gap-2">
            {bathOptions.map((option) => (
              <button
                key={option}
                onClick={() => setFilters({ ...filters, baths: filters.baths === option ? "" : option })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filters.baths === option
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div className="space-y-3">
          <Label>Property Type</Label>
          <div className="flex flex-wrap gap-2">
            {propertyTypes.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setFilters({ ...filters, propertyType: filters.propertyType === type ? "" : type })
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filters.propertyType === type
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Square Footage */}
      <div className="grid md:grid-cols-2 gap-4 max-w-md">
        <div className="space-y-2">
          <Label>Min Sqft</Label>
          <Input
            type="number"
            placeholder="1000"
            value={filters.sqftMin}
            onChange={(e) => setFilters({ ...filters, sqftMin: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Sqft</Label>
          <Input
            type="number"
            placeholder="5000"
            value={filters.sqftMax}
            onChange={(e) => setFilters({ ...filters, sqftMax: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() =>
            setFilters({
              priceMin: "",
              priceMax: "",
              beds: "",
              baths: "",
              propertyType: "",
              sqftMin: "",
              sqftMax: "",
            })
          }
        >
          Clear All Filters
        </Button>
        <Button onClick={onClose}>Apply Filters</Button>
      </div>
    </div>
  );
}
