"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AgentCard } from "@/components/agents/agent-card";

const agents = [
  {
    id: 1,
    name: "Jessica Martinez",
    title: "Senior Real Estate Agent",
    company: "AI Realty Beverly Hills",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    rating: 4.9,
    reviews: 127,
    sales: 89,
    speciality: "Luxury Properties",
    location: "Beverly Hills, CA",
    phone: "(310) 555-0123",
  },
  {
    id: 2,
    name: "David Chen",
    title: "Real Estate Consultant",
    company: "AI Realty Downtown",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    rating: 4.8,
    reviews: 98,
    sales: 65,
    speciality: "Urban Apartments",
    location: "Los Angeles, CA",
    phone: "(213) 555-0456",
  },
  {
    id: 3,
    name: "Sarah Williams",
    title: "Luxury Property Specialist",
    company: "AI Realty Malibu",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    rating: 5.0,
    reviews: 156,
    sales: 112,
    speciality: "Beachfront Properties",
    location: "Malibu, CA",
    phone: "(310) 555-0789",
  },
  {
    id: 4,
    name: "Michael Brown",
    title: "Property Investment Advisor",
    company: "AI Realty San Francisco",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    rating: 4.7,
    reviews: 84,
    sales: 53,
    speciality: "Investment Properties",
    location: "San Francisco, CA",
    phone: "(415) 555-0321",
  },
  {
    id: 5,
    name: "Emily Johnson",
    title: "First-Time Buyer Specialist",
    company: "AI Realty Pasadena",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    rating: 4.9,
    reviews: 72,
    sales: 45,
    speciality: "First-Time Buyers",
    location: "Pasadena, CA",
    phone: "(626) 555-0654",
  },
  {
    id: 6,
    name: "Robert Taylor",
    title: "Commercial Property Expert",
    company: "AI Realty Commercial",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    rating: 4.8,
    reviews: 91,
    sales: 78,
    speciality: "Commercial Real Estate",
    location: "Los Angeles, CA",
    phone: "(213) 555-0987",
  },
];

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const specialties = [...new Set(agents.map((a) => a.speciality))];

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || agent.speciality === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find an Agent</h1>
        <p className="text-gray-600">Connect with experienced real estate professionals</p>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or location..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Specialty Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedSpecialty === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedSpecialty(null)}
        >
          All
        </Button>
        {specialties.map((specialty) => (
          <Button
            key={specialty}
            variant={selectedSpecialty === specialty ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSpecialty(specialty)}
          >
            {specialty}
          </Button>
        ))}
      </div>

      {/* Top Rated Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Star className="h-8 w-8 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Top Rated Agent of the Month</h3>
              <p className="text-blue-100">Sarah Williams - 156 reviews, 5.0 rating, $150M+ in sales</p>
            </div>
            <Button className="ml-auto bg-white text-blue-600 hover:bg-blue-50">Contact Now</Button>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
