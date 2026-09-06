"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveButtonProps {
  propertyId: number;
  initialSaved?: boolean;
}

export function SaveButton({ propertyId, initialSaved = false }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnimating(true);
    setIsSaved(!isSaved);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className={`rounded-full ${
        isSaved ? "bg-red-50 hover:bg-red-100" : "bg-white/80 hover:bg-white"
      }`}
      onClick={handleToggle}
    >
      <Heart
        className={`h-5 w-5 transition-transform ${
          isSaved ? "fill-red-500 text-red-500" : "text-gray-600"
        } ${isAnimating ? "scale-125" : "scale-100"}`}
      />
    </Button>
  );
}
