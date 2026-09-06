"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const transactions = [
  {
    id: 1,
    property: "Modern Villa in Beverly Hills",
    address: "123 Sunset Blvd, Beverly Hills, CA",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=150&fit=crop",
    price: 2450000,
    buyer: "John Smith",
    seller: "ABC Properties LLC",
    agent: "Jessica Martinez",
    status: "In Progress",
    stage: "Inspection",
    startDate: "Dec 15, 2024",
    closingDate: "Jan 30, 2024",
    progress: 65,
  },
  {
    id: 2,
    property: "Downtown Loft Apartment",
    address: "456 Main St, Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=150&fit=crop",
    price: 825000,
    buyer: "Emily Chen",
    seller: "Metro Homes Inc",
    agent: "David Chen",
    status: "In Progress",
    stage: "Financing",
    startDate: "Dec 10, 2024",
    closingDate: "Jan 25, 2024",
    progress: 45,
  },
  {
    id: 3,
    property: "Coastal Beach House",
    address: "789 Ocean Ave, Malibu, CA",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=150&fit=crop",
    price: 3600000,
    buyer: "Michael Brown",
    seller: "Oceanfront Estates",
    agent: "Sarah Williams",
    status: "Completed",
    stage: "Closed",
    startDate: "Nov 1, 2024",
    closingDate: "Dec 15, 2024",
    progress: 100,
  },
];

const stages = ["Offer", "Contract", "Inspection", "Financing", "Closing", "Closed"];

const statusColors = {
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter(
    (t) =>
      t.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buyer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Track your property transactions from start to finish</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Active Transactions</p>
            <p className="text-2xl font-bold text-gray-900">5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">$12.5M</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Avg. Days to Close</p>
            <p className="text-2xl font-bold text-gray-900">32</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-gray-900">94%</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search transactions..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <img
                  src={transaction.image}
                  alt={transaction.property}
                  className="w-24 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{transaction.property}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[transaction.status as keyof typeof statusColors]
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{transaction.address}</p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{transaction.stage}</span>
                      <span>{transaction.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${transaction.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage Indicators */}
                  <div className="flex items-center gap-1">
                    {stages.map((stage, i) => (
                      <div key={stage} className="flex items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            stages.indexOf(transaction.stage) >= i
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {stages.indexOf(transaction.stage) > i ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            i + 1
                          )}
                        </div>
                        {i < stages.length - 1 && (
                          <div
                            className={`w-8 h-0.5 ${
                              stages.indexOf(transaction.stage) > i ? "bg-blue-600" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">${transaction.price.toLocaleString()}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Closing: {transaction.closingDate}
                    </p>
                    <p>Buyer: {transaction.buyer}</p>
                    <p>Agent: {transaction.agent}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3">
                    <FileText className="mr-1 h-3 w-3" />
                    Details
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
