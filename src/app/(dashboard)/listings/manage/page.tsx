"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const listings = [
  {
    id: 1,
    title: "Modern Villa in Beverly Hills",
    address: "123 Sunset Blvd, Beverly Hills, CA",
    price: 2450000,
    beds: 4,
    baths: 3,
    sqft: 3200,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=150&fit=crop",
    status: "Active",
    views: 1243,
    inquiries: 28,
    daysOnMarket: 15,
  },
  {
    id: 2,
    title: "Downtown Loft Apartment",
    address: "456 Main St, Los Angeles, CA",
    price: 850000,
    beds: 2,
    baths: 2,
    sqft: 1800,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=150&fit=crop",
    status: "Active",
    views: 876,
    inquiries: 15,
    daysOnMarket: 22,
  },
  {
    id: 3,
    title: "Coastal Beach House",
    address: "789 Ocean Ave, Malibu, CA",
    price: 3750000,
    beds: 5,
    baths: 4,
    sqft: 4500,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=150&fit=crop",
    status: "Pending",
    views: 2341,
    inquiries: 52,
    daysOnMarket: 8,
  },
  {
    id: 4,
    title: "Mountain Retreat Cabin",
    address: "321 Pine Rd, Lake Tahoe, CA",
    price: 1200000,
    beds: 3,
    baths: 2,
    sqft: 2400,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=200&h=150&fit=crop",
    status: "Active",
    views: 654,
    inquiries: 12,
    daysOnMarket: 30,
  },
];

const stats = [
  { title: "Active Listings", value: "12", icon: Building2 },
  { title: "Total Views", value: "5,114", icon: Eye },
  { title: "Inquiries", value: "107", icon: TrendingUp },
  { title: "Avg. Days on Market", value: "18", icon: BarChart3 },
];

export default function ManageListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredListings = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Listings</h1>
          <p className="text-gray-600">Track and manage your property listings</p>
        </div>
        <Button asChild>
          <Link href="/(dashboard)/listings/create">
            <Plus className="mr-2 h-4 w-4" />
            New Listing
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search listings..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Listings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Property</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Price</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Views</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Inquiries</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Days Listed</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="w-16 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <Link
                            href={`/(dashboard)/properties/${listing.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-xs text-gray-500">{listing.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">${listing.price.toLocaleString()}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          listing.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{listing.views.toLocaleString()}</td>
                    <td className="p-4 text-gray-600">{listing.inquiries}</td>
                    <td className="p-4 text-gray-600">{listing.daysOnMarket}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
