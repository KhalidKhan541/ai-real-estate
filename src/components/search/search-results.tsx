"use client";

import { Grid, List, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/property-card";

const sampleResults = [
  {
    id: 1,
    title: "Modern Villa in Beverly Hills",
    address: "123 Sunset Blvd, Beverly Hills, CA",
    price: 2450000,
    beds: 4,
    baths: 3,
    sqft: 3200,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
    status: "Active" as const,
    type: "Villa",
    matchScore: 95,
  },
  {
    id: 2,
    title: "Downtown Loft Apartment",
    address: "456 Main St, Los Angeles, CA",
    price: 850000,
    beds: 2,
    baths: 2,
    sqft: 1800,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
    status: "Active" as const,
    type: "Apartment",
    matchScore: 88,
  },
  {
    id: 3,
    title: "Coastal Beach House",
    address: "789 Ocean Ave, Malibu, CA",
    price: 3750000,
    beds: 5,
    baths: 4,
    sqft: 4500,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    status: "Pending" as const,
    type: "House",
    matchScore: 82,
  },
  {
    id: 4,
    title: "Mountain Retreat Cabin",
    address: "321 Pine Rd, Lake Tahoe, CA",
    price: 1200000,
    beds: 3,
    baths: 2,
    sqft: 2400,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&h=400&fit=crop",
    status: "Active" as const,
    type: "Cabin",
    matchScore: 78,
  },
];

interface SearchResultsProps {
  query: string;
  filters: any;
}

export function SearchResults({ query, filters }: SearchResultsProps) {
  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {sampleResults.length} Properties Found
          </h2>
          {query && (
            <span className="text-sm text-gray-500">
              for &quot;{query}&quot;
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MapPin className="mr-1 h-3 w-3" />
            Map View
          </Button>
        </div>
      </div>

      {/* AI Recommendations Banner */}
      {query && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">AI-Powered Results</p>
              <p className="text-sm text-gray-600">
                Properties ranked by relevance to your search criteria
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleResults.map((property) => (
          <div key={property.id} className="relative">
            <PropertyCard property={property} layout="grid" />
            {property.matchScore && (
              <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                <span className="text-xs font-medium text-blue-600">
                  {property.matchScore}% match
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-4">
        <Button variant="outline" size="lg">
          Load More Properties
        </Button>
      </div>
    </div>
  );
}
