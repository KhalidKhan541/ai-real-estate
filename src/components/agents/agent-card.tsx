"use client";

import Link from "next/link";
import { MapPin, MessageSquare, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Agent {
  id: number;
  name: string;
  title: string;
  company: string;
  image: string;
  rating: number;
  reviews: number;
  sales: number;
  speciality: string;
  location: string;
  phone: string;
}

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Link href={`/(dashboard)/agents/${agent.id}`}>
            <img
              src={agent.image}
              alt={agent.name}
              className="w-16 h-16 rounded-xl object-cover hover:opacity-90 transition"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/(dashboard)/agents/${agent.id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition"
            >
              {agent.name}
            </Link>
            <p className="text-sm text-gray-500">{agent.title}</p>
            <p className="text-xs text-gray-400">{agent.company}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{agent.rating}</span>
            <span className="text-gray-500">({agent.reviews})</span>
          </div>
          <div className="text-gray-500">
            {agent.sales} sales
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{agent.location}</span>
        </div>

        <div className="mt-3">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            {agent.speciality}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" size="sm">
            <Phone className="mr-1 h-3 w-3" />
            Call
          </Button>
          <Button className="flex-1" size="sm" asChild>
            <Link href={`/(dashboard)/agents/${agent.id}`}>
              <MessageSquare className="mr-1 h-3 w-3" />
              Message
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
