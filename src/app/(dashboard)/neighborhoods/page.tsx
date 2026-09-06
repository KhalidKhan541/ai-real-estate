"use client";

import { useState } from "react";
import { Search, TrendingUp, Home, Users, School, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NeighborhoodCard } from "@/components/neighborhoods/neighborhood-card";

const neighborhoods = [
  {
    id: 1,
    name: "Beverly Hills",
    city: "Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
    avgPrice: 3200000,
    priceChange: 8.5,
    medianIncome: 150000,
    population: 34000,
    walkScore: 85,
    schools: 9.2,
    safety: 8.8,
    description: "World-famous luxury neighborhood known for high-end shopping, dining, and celebrity homes.",
  },
  {
    id: 2,
    name: "Downtown LA",
    city: "Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop",
    avgPrice: 750000,
    priceChange: 12.3,
    medianIncome: 85000,
    population: 55000,
    walkScore: 95,
    schools: 7.5,
    safety: 7.2,
    description: "Vibrant urban center with arts, entertainment, and a growing tech scene.",
  },
  {
    id: 3,
    name: "Malibu",
    city: "Malibu, CA",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    avgPrice: 4500000,
    priceChange: 5.2,
    medianIncome: 200000,
    population: 13000,
    walkScore: 45,
    schools: 8.5,
    safety: 9.0,
    description: "Iconic coastal city with stunning beaches and luxury oceanfront properties.",
  },
  {
    id: 4,
    name: "Pasadena",
    city: "Pasadena, CA",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop",
    avgPrice: 1200000,
    priceChange: 6.8,
    medianIncome: 95000,
    population: 140000,
    walkScore: 72,
    schools: 8.8,
    safety: 8.5,
    description: "Charming city known for the Rose Bowl, Caltech, and historic architecture.",
  },
  {
    id: 5,
    name: "Santa Monica",
    city: "Santa Monica, CA",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop",
    avgPrice: 2100000,
    priceChange: 7.1,
    medianIncome: 110000,
    population: 93000,
    walkScore: 90,
    schools: 8.2,
    safety: 8.0,
    description: "Beach city with a laid-back vibe, great schools, and tech industry presence.",
  },
  {
    id: 6,
    name: "Silver Lake",
    city: "Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
    avgPrice: 1400000,
    priceChange: 9.2,
    medianIncome: 80000,
    population: 35000,
    walkScore: 82,
    schools: 7.8,
    safety: 7.5,
    description: "Hip, artistic neighborhood with trendy cafes, boutiques, and hillside homes.",
  },
];

export default function NeighborhoodsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNeighborhoods = neighborhoods.filter(
    (n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Neighborhoods</h1>
        <p className="text-gray-600">Explore neighborhoods with AI-powered insights</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search neighborhoods..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">24</p>
                <p className="text-xs text-gray-500">Neighborhoods</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">+8.2%</p>
                <p className="text-xs text-gray-500">Avg. Price Growth</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <School className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">8.5</p>
                <p className="text-xs text-gray-500">Avg. School Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">8.3</p>
                <p className="text-xs text-gray-500">Avg. Safety Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Neighborhoods Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNeighborhoods.map((neighborhood) => (
          <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
        ))}
      </div>
    </div>
  );
}
