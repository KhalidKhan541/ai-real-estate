"use client";

import Link from "next/link";
import { TrendingUp, Home, Users, School, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Neighborhood {
  id: number;
  name: string;
  city: string;
  image: string;
  avgPrice: number;
  priceChange: number;
  medianIncome: number;
  population: number;
  walkScore: number;
  schools: number;
  safety: number;
  description: string;
}

interface NeighborhoodCardProps {
  neighborhood: Neighborhood;
}

export function NeighborhoodCard({ neighborhood }: NeighborhoodCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative">
        <img
          src={neighborhood.image}
          alt={neighborhood.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold">{neighborhood.name}</h3>
          <p className="text-sm text-gray-200">{neighborhood.city}</p>
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <div className="flex items-center gap-1">
            <TrendingUp className={`h-4 w-4 ${neighborhood.priceChange >= 0 ? "text-green-600" : "text-red-600"}`} />
            <span className={`text-sm font-medium ${neighborhood.priceChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {neighborhood.priceChange >= 0 ? "+" : ""}{neighborhood.priceChange}%
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">{neighborhood.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Avg. Price</p>
            <p className="font-bold text-gray-900">${(neighborhood.avgPrice / 1000000).toFixed(1)}M</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Median Income</p>
            <p className="font-bold text-gray-900">${(neighborhood.medianIncome / 1000).toFixed(0)}K</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Population</p>
            <p className="font-bold text-gray-900">{(neighborhood.population / 1000).toFixed(0)}K</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1 p-2 bg-blue-50 rounded-lg">
            <School className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{neighborhood.schools}</span>
          </div>
          <div className="flex items-center gap-1 p-2 bg-green-50 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{neighborhood.safety}</span>
          </div>
          <div className="flex items-center gap-1 p-2 bg-purple-50 rounded-lg">
            <Home className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">{neighborhood.walkScore}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href={`/(dashboard)/neighborhoods/${neighborhood.id}`}>
            Explore Neighborhood
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
