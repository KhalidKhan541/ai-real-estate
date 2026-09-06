"use client";

import { useState } from "react";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyCard } from "@/components/properties/property-card";

const savedProperties = [
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
    savedDate: "2 days ago",
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
    savedDate: "5 days ago",
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
    savedDate: "1 week ago",
  },
];

export default function SavedPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = savedProperties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
        <p className="text-gray-600">Properties you&apos;ve saved for later review</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search saved properties..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved properties</h3>
            <p className="text-gray-600 mb-4">Start saving properties to review them later</p>
            <Button>Browse Properties</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} layout="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
