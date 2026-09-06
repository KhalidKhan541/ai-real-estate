"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Grid3X3,
  Info,
  Maximize2,
  Move,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const rooms = [
  { id: 1, name: "Living Room", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?w=1200&h=800&fit=crop" },
  { id: 2, name: "Kitchen", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop" },
  { id: 3, name: "Master Bedroom", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop" },
  { id: 4, name: "Bathroom", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&h=800&fit=crop" },
  { id: 5, name: "Backyard", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&fit=crop" },
];

const hotspots = [
  { id: 1, x: 30, y: 40, label: "Fireplace", type: "feature" },
  { id: 2, x: 60, y: 60, label: "To Kitchen", type: "navigation" },
  { id: 3, x: 80, y: 35, label: "Floor-to-ceiling windows", type: "feature" },
];

export function TourViewer() {
  const [currentRoom, setCurrentRoom] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="space-y-4">
      {/* Tour Viewer */}
      <div className="relative bg-black rounded-xl overflow-hidden">
        <img
          src={rooms[currentRoom].image}
          alt={rooms[currentRoom].name}
          className="w-full h-[500px] object-cover"
        />

        {/* Navigation Arrows */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <button
            onClick={() => setCurrentRoom((prev) => (prev === 0 ? rooms.length - 1 : prev - 1))}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => setCurrentRoom((prev) => (prev === rooms.length - 1 ? 0 : prev + 1))}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Room Name */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
          <p className="font-medium">{rooms[currentRoom].name}</p>
          <p className="text-sm text-gray-300">Room {currentRoom + 1} of {rooms.length}</p>
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center text-white backdrop-blur-sm transition"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white backdrop-blur-sm transition ${
              showHotspots ? "bg-blue-600" : "bg-black/50 hover:bg-black/70"
            }`}
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center text-white backdrop-blur-sm transition">
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>

        {/* Hotspots */}
        {showHotspots && hotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            className="absolute cursor-pointer group"
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center animate-pulse ${
              hotspot.type === "navigation"
                ? "bg-blue-500"
                : "bg-white"
            }`}>
              {hotspot.type === "navigation" ? (
                <Move className="h-4 w-4 text-white" />
              ) : (
                <Info className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap backdrop-blur-sm">
                {hotspot.label}
              </div>
            </div>
          </div>
        ))}

        {/* Compass */}
        <div className="absolute bottom-4 right-4">
          <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
            <Compass className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Room Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {rooms.map((room, index) => (
          <button
            key={room.id}
            onClick={() => setCurrentRoom(index)}
            className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
              index === currentRoom
                ? "border-blue-500"
                : "border-transparent hover:border-gray-300"
            }`}
          >
            <div className="relative">
              <img src={room.image} alt={room.name} className="w-24 h-16 object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white text-xs font-medium">{room.name}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* AI Insights */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">AI Room Analysis</h4>
              <p className="text-sm text-gray-600">
                This living room features excellent natural lighting with south-facing windows.
                The open floor plan creates a spacious feel, and the fireplace adds a cozy focal point.
                The high ceilings (10ft) enhance the sense of space. Suggested improvements: add ambient
                lighting fixtures and consider upgrading the flooring to hardwood for better value.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
