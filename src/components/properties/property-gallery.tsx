"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyGalleryProps {
  images: string[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative rounded-xl overflow-hidden bg-gray-100">
        <img
          src={images[currentIndex]}
          alt={`Property image ${currentIndex + 1}`}
          className="w-full h-[400px] object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={goToPrevious}
            className="bg-white/80 hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={goToNext}
            className="bg-white/80 hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/80 hover:bg-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/80 hover:bg-white"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition ${
              index === currentIndex
                ? "border-blue-500"
                : "border-transparent hover:border-gray-300"
            }`}
          >
            <img src={image} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
