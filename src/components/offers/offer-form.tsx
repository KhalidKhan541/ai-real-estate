"use client";

import { useState } from "react";
import { Calendar, DollarSign, FileText, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OfferFormProps {
  propertyPrice: number;
  propertyAddress: string;
}

export function OfferForm({ propertyPrice, propertyAddress }: OfferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    offerPrice: "",
    earnestMoney: "",
    downPayment: "",
    financingType: "conventional",
    closingDate: "",
    contingencies: [] as string[],
    message: "",
  });

  const contingenciesOptions = [
    "Inspection Contingency",
    "Financing Contingency",
    "Appraisal Contingency",
    "Home Sale Contingency",
  ];

  const toggleContingency = (contingency: string) => {
    setFormData((prev) => ({
      ...prev,
      contingencies: prev.contingencies.includes(contingency)
        ? prev.contingencies.filter((c) => c !== contingency)
        : [...prev.contingencies, contingency],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsSubmitting(false);
    alert("Offer submitted successfully!");
  };

  const offerAmount = Number(formData.offerPrice) || 0;
  const offerPercentage = ((offerAmount / propertyPrice) * 100).toFixed(1);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Property Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Property Address</p>
              <p className="font-medium text-gray-900">{propertyAddress}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">List Price</p>
              <p className="text-xl font-bold text-gray-900">${propertyPrice.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offer Amount */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Your Offer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="offerPrice">Offer Price ($)</Label>
            <Input
              id="offerPrice"
              type="number"
              placeholder="e.g., 2400000"
              value={formData.offerPrice}
              onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
              required
            />
            {offerAmount > 0 && (
              <p className={`text-sm mt-1 ${offerAmount >= propertyPrice ? "text-green-600" : "text-orange-600"}`}>
                {offerPercentage}% of list price
                {offerAmount < propertyPrice && ` (${((propertyPrice - offerAmount) / 1000).toFixed(0)}K below)`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="earnestMoney">Earnest Money ($)</Label>
              <Input
                id="earnestMoney"
                type="number"
                placeholder="e.g., 25000"
                value={formData.earnestMoney}
                onChange={(e) => setFormData({ ...formData, earnestMoney: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="downPayment">Down Payment ($)</Label>
              <Input
                id="downPayment"
                type="number"
                placeholder="e.g., 500000"
                value={formData.downPayment}
                onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Financing Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Financing Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {["Conventional", "FHA", "Cash"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, financingType: type.toLowerCase() })}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    formData.financingType === type.toLowerCase()
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="closingDate">Preferred Closing Date</Label>
            <Input
              id="closingDate"
              type="date"
              value={formData.closingDate}
              onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contingencies */}
      <Card>
        <CardHeader>
          <CardTitle>Contingencies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {contingenciesOptions.map((contingency) => (
              <button
                key={contingency}
                type="button"
                onClick={() => toggleContingency(contingency)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  formData.contingencies.includes(contingency)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {contingency}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      <Card>
        <CardHeader>
          <CardTitle>Message to Seller</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write a personal message to the seller explaining why you'd be a great buyer..."
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" className="flex-1">
          Save as Draft
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Offer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
