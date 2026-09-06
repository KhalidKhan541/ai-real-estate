"use client";

import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TourViewer } from "@/components/virtual-tours/tour-viewer";

export default function VirtualTourPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/(dashboard)/properties/1"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Property
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Tour</h1>
          <p className="text-gray-600">Modern Villa in Beverly Hills</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TourViewer />

      {/* Tour Controls */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border">
          <h3 className="font-semibold text-gray-900 mb-2">Room Navigation</h3>
          <p className="text-sm text-gray-600">Click on hotspots to move between rooms. Use arrow keys for quick navigation.</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <h3 className="font-semibold text-gray-900 mb-2">AI Insights</h3>
          <p className="text-sm text-gray-600">Get AI-powered analysis of each room including natural lighting, space optimization, and renovation potential.</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <h3 className="font-semibold text-gray-900 mb-2">Measurement Mode</h3>
          <p className="text-sm text-gray-600">Toggle measurement mode to measure room dimensions and plan furniture placement.</p>
        </div>
      </div>
    </div>
  );
}
