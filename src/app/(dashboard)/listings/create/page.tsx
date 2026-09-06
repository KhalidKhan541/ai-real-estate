"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const propertyTypes = ["House", "Apartment", "Condo", "Villa", "Townhouse", "Land", "Commercial"];
const amenities = [
  "Pool", "Garage", "Garden", "Fireplace", "AC", "Washer/Dryer",
  "Dishwasher", "Smart Home", "Gym", "Rooftop", "Balcony", "Storage",
];

export default function CreateListingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    propertyType: "",
    beds: "",
    baths: "",
    sqft: "",
    yearBuilt: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsSubmitting(false);
    alert("Listing created successfully!");
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const addImage = () => {
    setImages((prev) => [
      ...prev,
      `https://images.unsplash.com/photo-${Date.now()}?w=600&h=400&fit=crop`,
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/(dashboard)/listings/manage" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Listing</h1>
        <p className="text-gray-600">List your property on the AI Realty platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Property Title</Label>
              <Input
                id="title"
                placeholder="e.g., Modern Villa with Ocean View"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your property in detail..."
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 2500000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Property Type</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {propertyTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, propertyType: type })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        formData.propertyType === type
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="beds">Bedrooms</Label>
                <Input id="beds" type="number" placeholder="4" value={formData.beds} onChange={(e) => setFormData({ ...formData, beds: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="baths">Bathrooms</Label>
                <Input id="baths" type="number" placeholder="3" value={formData.baths} onChange={(e) => setFormData({ ...formData, baths: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="sqft">Square Feet</Label>
                <Input id="sqft" type="number" placeholder="3200" value={formData.sqft} onChange={(e) => setFormData({ ...formData, sqft: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input id="yearBuilt" type="number" placeholder="2021" value={formData.yearBuilt} onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" placeholder="123 Sunset Blvd" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Beverly Hills" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" placeholder="CA" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" placeholder="90210" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="w-full h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addImage}
                className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 transition"
              >
                <ImagePlus className="h-8 w-8 mb-2" />
                <span className="text-sm">Add Photo</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    selectedAmenities.includes(amenity)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/(dashboard)/listings/manage">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Listing"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
