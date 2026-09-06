"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bed,
  Bath,
  Maximize,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Building2,
  Sparkles,
  MessageSquare,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { PropertyMap } from "@/components/properties/property-map";
import { SaveButton } from "@/components/shared/save-button";

const property = {
  id: 1,
  title: "Modern Villa in Beverly Hills",
  address: "123 Sunset Blvd, Beverly Hills, CA 90210",
  price: 2450000,
  beds: 4,
  baths: 3,
  sqft: 3200,
  year: 2021,
  type: "Villa",
  status: "Active",
  description:
    "Experience luxury living in this stunning modern villa located in the heart of Beverly Hills. This architectural masterpiece features floor-to-ceiling windows, an open-concept design, and premium finishes throughout. The gourmet kitchen includes top-of-the-line appliances, custom cabinetry, and a large island perfect for entertaining. The primary suite offers a spa-like bathroom with dual vanities, a soaking tub, and a walk-in closet. Enjoy outdoor living with a private pool, landscaped gardens, and stunning city views.",
  features: [
    "Private Swimming Pool",
    "Smart Home Technology",
    "Wine Cellar",
    "Home Theater",
    "3-Car Garage",
    "Panoramic City Views",
    "Chef's Kitchen",
    "Spa Bathroom",
  ],
  images: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=500&fit=crop",
  ],
  agent: {
    name: "Jessica Martinez",
    phone: "(310) 555-0123",
    email: "jessica@airealty.com",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  priceHistory: [
    { date: "Jan 2024", price: 2200000 },
    { date: "Jun 2024", price: 2350000 },
    { date: "Dec 2024", price: 2450000 },
  ],
};

export default function PropertyDetailPage() {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/(dashboard)/properties" className="inline-flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Properties
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <PropertyGallery images={property.images} />

          {/* Property Info */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SaveButton propertyId={property.id} />
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="text-3xl font-bold text-blue-600">${property.price.toLocaleString()}</div>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Bed className="h-5 w-5" />
                  <span>{property.beds} Beds</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="h-5 w-5" />
                  <span>{property.baths} Baths</span>
                </div>
                <div className="flex items-center gap-1">
                  <Maximize className="h-5 w-5" />
                  <span>{property.sqft.toLocaleString()} sqft</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{property.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Built {property.year}</span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {property.status}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="history">Price History</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 leading-relaxed">{property.description}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-3">
                    {property.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <PropertyMap />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {property.priceHistory.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">{entry.date}</span>
                        <span className="font-semibold">${entry.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Market Position: Strong</p>
                <p className="text-xs text-green-600 mt-1">Priced 5% below market average for similar properties</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Investment Potential: High</p>
                <p className="text-xs text-blue-600 mt-1">Area showing 12% annual appreciation</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-800">Neighborhood Score: 9.2/10</p>
                <p className="text-xs text-purple-600 mt-1">Excellent schools, low crime, high walkability</p>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Tour */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule a Tour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link href={`/(dashboard)/properties/${property.id}/virtual-tour`}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Virtual Tour
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                In-Person Tour
              </Button>
            </CardContent>
          </Card>

          {/* Agent Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={property.agent.image}
                  alt={property.agent.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{property.agent.name}</p>
                  <p className="text-sm text-gray-500">Licensed Agent</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="mr-2 h-4 w-4" />
                  {property.agent.phone}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="mr-2 h-4 w-4" />
                  {property.agent.email}
                </Button>
                <Button className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
