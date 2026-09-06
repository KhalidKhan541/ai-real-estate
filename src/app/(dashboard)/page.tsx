"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  DollarSign,
  Eye,
  Heart,
  Home,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stats = [
  { title: "Total Properties", value: "1,284", change: "+12%", trend: "up", icon: Building2 },
  { title: "Active Listings", value: "456", change: "+8%", trend: "up", icon: Home },
  { title: "Total Leads", value: "2,891", change: "+23%", trend: "up", icon: MessageSquare },
  { title: "Revenue", value: "$1.2M", change: "+15%", trend: "up", icon: DollarSign },
];

const recentListings = [
  {
    id: 1,
    title: "Modern Villa in Beverly Hills",
    address: "123 Sunset Blvd, Beverly Hills, CA",
    price: 2450000,
    beds: 4,
    baths: 3,
    sqft: 3200,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    status: "Active",
  },
  {
    id: 2,
    title: "Downtown Loft Apartment",
    address: "456 Main St, Los Angeles, CA",
    price: 850000,
    beds: 2,
    baths: 2,
    sqft: 1800,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    status: "Active",
  },
  {
    id: 3,
    title: "Coastal Beach House",
    address: "789 Ocean Ave, Malibu, CA",
    price: 3750000,
    beds: 5,
    baths: 4,
    sqft: 4500,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    status: "Pending",
  },
];

const recentLeads = [
  { name: "Sarah Johnson", email: "sarah@email.com", interest: "Luxury Villas", date: "2 hours ago" },
  { name: "Mike Chen", email: "mike@email.com", interest: "Downtown Apartments", date: "4 hours ago" },
  { name: "Emily Davis", email: "emily@email.com", interest: "Beach Houses", date: "1 day ago" },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your properties.</p>
        </div>
        <Button asChild>
          <Link href="/(dashboard)/listings/create">
            <Home className="mr-2 h-4 w-4" />
            New Listing
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Listings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Listings</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/(dashboard)/listings/manage">
                  View All
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/(dashboard)/properties/${listing.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
                  >
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-20 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{listing.title}</h4>
                      <p className="text-sm text-gray-500 truncate">{listing.address}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>{listing.beds} beds</span>
                        <span>{listing.baths} baths</span>
                        <span>{listing.sqft.toLocaleString()} sqft</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${listing.price.toLocaleString()}</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          listing.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Leads</CardTitle>
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm">{lead.name}</h4>
                    <p className="text-xs text-gray-500">{lead.interest}</p>
                  </div>
                  <span className="text-xs text-gray-400">{lead.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/(dashboard)/search">
                <Eye className="h-6 w-6" />
                <span>Search Properties</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/(dashboard)/saved">
                <Heart className="h-6 w-6" />
                <span>Saved Properties</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/(dashboard)/mortgage">
                <DollarSign className="h-6 w-6" />
                <span>Mortgage Calc</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/(dashboard)/agents">
                <MessageSquare className="h-6 w-6" />
                <span>Find Agent</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
