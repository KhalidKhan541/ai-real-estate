"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, List, MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyMap } from "@/components/properties/property-map";

const properties = [
  { id: 1, title: "Modern Villa", price: 2450000, beds: 4, baths: 3, lat: 34.0736, lng: -118.4004, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100&h=100&fit=crop" },
  { id: 2, title: "Downtown Loft", price: 850000, beds: 2, baths: 2, lat: 34.0522, lng: -118.2437, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=100&h=100&fit=crop" },
  { id: 3, title: "Beach House", price: 3750000, beds: 5, baths: 4, lat: 34.0259, lng: -118.7798, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&h=100&fit=crop" },
  { id: 4, title: "Mountain Cabin", price: 1200000, beds: 3, baths: 2, lat: 39.0968, lng: -120.0324, image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=100&h=100&fit=crop" },
  { id: 5, title: "Urban Penthouse", price: 4500000, beds: 3, baths: 3, lat: 37.7749, lng: -122.4194, image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=100&h=100&fit=crop" },
];

export default function MapSearchPage() {
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite" | "terrain">("standard");
  const [listView, setListView] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/(dashboard)/search" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Map Search</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search location..." className="pl-10 w-64" />
          </div>
          <div className="flex border rounded-lg overflow-hidden">
            {(["standard", "satellite", "terrain"] as const).map((style) => (
              <button
                key={style}
                onClick={() => setMapStyle(style)}
                className={`px-3 py-1.5 text-sm capitalize ${
                  mapStyle === style ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          <Button variant={listView ? "default" : "outline"} size="icon" onClick={() => setListView(!listView)}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-200px)] rounded-xl overflow-hidden border relative">
        <PropertyMap properties={properties} mapStyle={mapStyle} />

        {/* Property Count Badge */}
        <div className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-lg shadow-lg">
          <span className="font-semibold">{properties.length} properties found</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white p-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Under $1M</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span>$1M-$3M</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>Over $3M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
