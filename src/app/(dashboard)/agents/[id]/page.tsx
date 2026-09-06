"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyCard } from "@/components/properties/property-card";

const agent = {
  id: 1,
  name: "Jessica Martinez",
  title: "Senior Real Estate Agent",
  company: "AI Realty Beverly Hills",
  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
  coverImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=400&fit=crop",
  rating: 4.9,
  reviews: 127,
  sales: 89,
  experience: "12 years",
  speciality: "Luxury Properties",
  location: "Beverly Hills, CA",
  phone: "(310) 555-0123",
  email: "jessica@airealty.com",
  bio: "Jessica Martinez is a seasoned real estate professional with over 12 years of experience in the luxury property market. She specializes in high-end residential properties in Beverly Hills, Bel Air, and Holmby Hills. Her deep knowledge of the local market, combined with her exceptional negotiation skills, has helped hundreds of clients find their dream homes. Jessica is known for her personalized approach, attention to detail, and commitment to exceeding client expectations.",
  stats: [
    { label: "Total Sales", value: "$89M", icon: DollarSign },
    { label: "Properties Sold", value: "89", icon: Building2 },
    { label: "Avg. Days on Market", value: "18", icon: Clock },
    { label: "Client Satisfaction", value: "99%", icon: Star },
  ],
  listings: [
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
    },
    {
      id: 2,
      title: "Luxury Penthouse Suite",
      address: "456 Rodeo Dr, Beverly Hills, CA",
      price: 5200000,
      beds: 3,
      baths: 4,
      sqft: 4800,
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
      status: "Active" as const,
      type: "Penthouse",
    },
  ],
  reviewsList: [
    { name: "John Smith", rating: 5, date: "2 weeks ago", text: "Jessica was absolutely amazing throughout the entire home buying process. Her knowledge of the Beverly Hills market is unmatched." },
    { name: "Emily Chen", rating: 5, date: "1 month ago", text: "Professional, responsive, and incredibly helpful. Found us our dream home in just two weeks!" },
    { name: "Michael Brown", rating: 4, date: "2 months ago", text: "Great experience working with Jessica. She really understands the luxury market." },
  ],
};

export default function AgentProfilePage() {
  return (
    <div className="space-y-6">
      <Link href="/(dashboard)/agents" className="inline-flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Agents
      </Link>

      {/* Cover & Profile */}
      <div className="relative">
        <img
          src={agent.coverImage}
          alt=""
          className="w-full h-48 md:h-64 object-cover rounded-xl"
        />
        <div className="absolute -bottom-12 left-6 flex items-end gap-4">
          <img
            src={agent.image}
            alt={agent.name}
            className="w-24 h-24 rounded-xl border-4 border-white object-cover shadow-lg"
          />
          <div className="pb-2">
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-gray-600">{agent.title} at {agent.company}</p>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary">
            <Heart className="mr-2 h-4 w-4" />
            Follow
          </Button>
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {agent.stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <stat.icon className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{agent.bio}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">{agent.speciality}</span>
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">{agent.experience} Experience</span>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                  <Award className="inline h-3 w-3 mr-1" />
                  Top Rated
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="listings">
            <TabsList>
              <TabsTrigger value="listings">Active Listings</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({agent.reviews})</TabsTrigger>
            </TabsList>

            <TabsContent value="listings" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                {agent.listings.map((listing) => (
                  <PropertyCard key={listing.id} property={listing} layout="grid" />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <div className="space-y-4">
                {agent.reviewsList.map((review, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {review.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{review.name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(review.rating)].map((_, j) => (
                                <Star key={j} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      <p className="text-gray-700">{review.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{agent.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{agent.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Office</p>
                  <p className="font-medium">{agent.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Response Time</p>
                  <p className="font-medium">Within 1 hour</p>
                </div>
              </div>
              <Button className="w-full mt-4">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full">
                <Phone className="mr-2 h-4 w-4" />
                Call Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Avg. Sale Price</span>
                <span className="font-semibold text-green-700">$998K</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">List-to-Sale Ratio</span>
                <span className="font-semibold text-blue-700">98.5%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-600">Repeat Clients</span>
                <span className="font-semibold text-purple-700">45%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
