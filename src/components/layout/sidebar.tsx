"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Calculator,
  Heart,
  Home,
  LayoutDashboard,
  Map,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/(dashboard)", label: "Overview", icon: LayoutDashboard },
  { href: "/(dashboard)/properties", label: "Properties", icon: Building2 },
  { href: "/(dashboard)/listings/manage", label: "Listings", icon: Home },
  { href: "/(dashboard)/search", label: "Search", icon: Search },
  { href: "/(dashboard)/search/map", label: "Map View", icon: Map },
  { href: "/(dashboard)/agents", label: "Agents", icon: Users },
  { href: "/(dashboard)/offers", label: "Offers", icon: MessageSquare },
  { href: "/(dashboard)/transactions", label: "Transactions", icon: TrendingUp },
  { href: "/(dashboard)/mortgage", label: "Calculator", icon: Calculator },
  { href: "/(dashboard)/neighborhoods", label: "Neighborhoods", icon: Map },
  { href: "/(dashboard)/saved", label: "Saved", icon: Heart },
  { href: "/(dashboard)/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r z-40 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/(dashboard)" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Home className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">AI Realty</span>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">AI Powered</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">AI Assistant</span>
          </div>
          <p className="text-sm text-blue-100 mb-3">
            Ask me anything about properties or market trends.
          </p>
          <button className="w-full bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-sm font-medium transition">
            Start Chat
          </button>
        </div>
      </div>
    </aside>
  );
}
