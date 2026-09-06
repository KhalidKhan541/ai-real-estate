"use client";

import Link from "next/link";
import { Bed, Bath, Maximize, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/shared/save-button";

interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  status: "Active" | "Pending" | "Sold";
  type: string;
}

interface PropertyCardProps {
  property: Property;
  layout?: "grid" | "list";
}

export function PropertyCard({ property, layout = "grid" }: PropertyCardProps) {
  if (layout === "list") {
    return (
      <Link href={`/(dashboard)/properties/${property.id}`} className="block">
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border hover:shadow-lg transition">
          <img
            src={property.image}
            alt={property.title}
            className="w-32 h-24 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  property.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : property.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {property.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">{property.address}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.beds}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.baths}</span>
              </div>
              <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                <span>{property.sqft.toLocaleString()} sqft</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">${property.price.toLocaleString()}</p>
            <span className="text-xs text-gray-500">{property.type}</span>
          </div>
          <SaveButton propertyId={property.id} />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/(dashboard)/properties/${property.id}`} className="block group">
      <div className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                property.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : property.status === "Pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {property.status}
            </span>
          </div>
          <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
            <SaveButton propertyId={property.id} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{property.title}</h3>
          <p className="text-sm text-gray-500 truncate mb-3">{property.address}</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-blue-600">${property.price.toLocaleString()}</p>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.beds}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.baths}</span>
              </div>
              <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                <span>{property.sqft.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
