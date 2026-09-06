"use client";

import { Calculator } from "@/components/mortgage/calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MortgagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mortgage Calculator</h1>
        <p className="text-gray-600">Estimate your monthly mortgage payments and affordability</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calculator />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tips for Buyers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">28% Rule</p>
                <p className="text-xs text-blue-600 mt-1">
                  Your monthly housing costs should not exceed 28% of your gross monthly income.
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Down Payment</p>
                <p className="text-xs text-green-600 mt-1">
                  A larger down payment means lower monthly payments and better interest rates.
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-800">Credit Score</p>
                <p className="text-xs text-purple-600 mt-1">
                  A credit score of 740+ typically qualifies for the best mortgage rates.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">30-Year Fixed</span>
                  <span className="font-semibold">6.5%</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">15-Year Fixed</span>
                  <span className="font-semibold">5.8%</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">5/1 ARM</span>
                  <span className="font-semibold">5.5%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Rates as of Jan 2024. Actual rates may vary.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
