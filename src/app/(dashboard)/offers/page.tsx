"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  FileText,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const offers = [
  {
    id: 1,
    property: "Modern Villa in Beverly Hills",
    address: "123 Sunset Blvd, Beverly Hills, CA",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1139a9?w=200&h=150&fit=crop",
    offerPrice: 2350000,
    listPrice: 2450000,
    status: "Pending",
    buyer: "John Smith",
    date: "2 days ago",
    expiry: "Jan 20, 2024",
  },
  {
    id: 2,
    property: "Downtown Loft Apartment",
    address: "456 Main St, Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=150&fit=crop",
    offerPrice: 825000,
    listPrice: 850000,
    status: "Accepted",
    buyer: "Emily Chen",
    date: "5 days ago",
    expiry: "Jan 15, 2024",
  },
  {
    id: 3,
    property: "Coastal Beach House",
    address: "789 Ocean Ave, Malibu, CA",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=150&fit=crop",
    offerPrice: 3600000,
    listPrice: 3750000,
    status: "Rejected",
    buyer: "Michael Brown",
    date: "1 week ago",
    expiry: "Jan 5, 2024",
  },
];

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Accepted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Counter: "bg-blue-100 text-blue-700",
};

export default function OffersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOffers = offers.filter(
    (o) =>
      o.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
          <p className="text-gray-600">Manage property offers and negotiations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-xs text-gray-500">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">$6.8M</p>
                <p className="text-xs text-gray-500">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search offers..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Offers List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Offers</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={offer.image}
                      alt={offer.property}
                      className="w-24 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{offer.property}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[offer.status as keyof typeof statusColors]}`}>
                          {offer.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{offer.address}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-600">Buyer: {offer.buyer}</span>
                        <span className="text-gray-600">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {offer.date}
                        </span>
                        <span className="text-gray-600">Expires: {offer.expiry}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">${offer.offerPrice.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">List: ${offer.listPrice.toLocaleString()}</p>
                      <p className={`text-sm font-medium ${offer.offerPrice < offer.listPrice ? "text-green-600" : "text-red-600"}`}>
                        {offer.offerPrice < offer.listPrice ? "-" : "+"}
                        {Math.abs(((offer.offerPrice - offer.listPrice) / offer.listPrice) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Message
                      </Button>
                      <Button size="sm">
                        View
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <p className="text-gray-600">Showing pending offers</p>
        </TabsContent>
        <TabsContent value="accepted" className="mt-4">
          <p className="text-gray-600">Showing accepted offers</p>
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <p className="text-gray-600">Showing rejected offers</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
