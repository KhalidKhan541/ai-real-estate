"use client";

import { useState } from "react";
import { Grid, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/property-card";

const properties = [
  {
    id: 1,
    title: "Modern Villa in Beverly Hills",
    address: "123 Sunset Blvd, Beverly Hills, CA 90210",
    price: 2450000,
    beds: 4,
    baths: 3,
    sqft: 3200,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
    status: "Active" as const,
    type: "Villa",
  },
  {
    id: 2,
    title: "Downtown Loft Apartment",
    address: "456 Main St, Los Angeles, CA 90012",
    price: 850000,
    beds: 2,
    baths: 2,
    sqft: 1800,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
    status: "Active" as const,
    type: "Apartment",
  },
  {
    id: 3,
    title: "Coastal Beach House",
    address: "789 Ocean Ave, Malibu, CA 90265",
    price: 3750000,
    beds: 5,
    baths: 4,
    sqft: 4500,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    status: "Pending" as const,
    type: "House",
  },
  {
    id: 4,
    title: "Mountain Retreat Cabin",
    address: "321 Pine Rd, Lake Tahoe, CA 96150",
    price: 1200000,
    beds: 3,
    baths: 2,
    sqft: 2400,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&h=400&fit=crop",
    status: "Active" as const,
    type: "Cabin",
  },
  {
    id: 5,
    title: "Urban Penthouse Suite",
    address: "888 Skyline Dr, San Francisco, CA 94102",
    price: 4500000,
    beds: 3,
    baths: 3,
    sqft: 3800,
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&h=400&fit=crop",
    status: "Active" as const,
    type: "Penthouse",
  },
  {
    id: 6,
    title: "Suburban Family Home",
    address: "567 Oak Lane, Pasadena, CA 91101",
    price: 950000,
    beds: 4,
    baths: 3,
    sqft: 2800,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop",
    status: "Active" as const,
    type: "House",
  },
];

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Browse all available properties</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }
      >
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} layout={viewMode} />
        ))}
      </div>
    </div>
  );
}
