import Link from "next/link";
import { ArrowRight, Home, Search, Shield, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Search",
    description: "Natural language property search that understands exactly what you're looking for",
  },
  {
    icon: Home,
    title: "Virtual Tours",
    description: "Immersive 3D virtual tours from the comfort of your home",
  },
  {
    icon: Shield,
    title: "Verified Listings",
    description: "Every property verified by our AI and human experts",
  },
  {
    icon: Users,
    title: "Top Agents",
    description: "Connect with experienced local real estate professionals",
  },
];

const stats = [
  { value: "10K+", label: "Properties Listed" },
  { value: "2K+", label: "Happy Clients" },
  { value: "500+", label: "Expert Agents" },
  { value: "98%", label: "Satisfaction Rate" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Home className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI Realty</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</Link>
              <Link href="#stats" className="text-gray-600 hover:text-gray-900 transition">About</Link>
              <Link href="/(auth)/login" className="text-gray-600 hover:text-gray-900 transition">Sign In</Link>
              <Button asChild>
                <Link href="/(auth)/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Real Estate Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Find Your Dream Home with{" "}
            <span className="text-blue-600">Intelligent Search</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Experience the future of real estate with AI-driven property matching, immersive virtual tours, and seamless transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/(auth)/register">
                Start Your Search
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
              <Link href="/(dashboard)/search/map">
                <Search className="mr-2 h-5 w-5" />
                Explore Map
              </Link>
            </Button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-20 relative rounded-2xl overflow-hidden shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=600&fit=crop"
            alt="Luxury home"
            className="w-full h-[400px] md:h-[500px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-8 left-8 text-white">
            <p className="text-sm opacity-80">Featured Property</p>
            <p className="text-2xl font-bold">Modern Villa in Beverly Hills</p>
            <p className="text-lg">$2,450,000</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose AI Realty?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Cutting-edge technology meets real estate expertise
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 rounded-xl border bg-white hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Find Your Perfect Home?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of happy homeowners who found their dream property with AI Realty.
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <Link href="/(auth)/register">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-bold text-white">AI Realty</span>
            </div>
            <p className="text-sm">AI-powered real estate platform making property search smarter and faster.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Properties</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/(dashboard)/properties" className="hover:text-white transition">Browse Listings</Link></li>
              <li><Link href="/(dashboard)/search" className="hover:text-white transition">Advanced Search</Link></li>
              <li><Link href="/(dashboard)/neighborhoods" className="hover:text-white transition">Neighborhoods</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/(dashboard)/agents" className="hover:text-white transition">Find Agents</Link></li>
              <li><Link href="#" className="hover:text-white transition">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
              <li><Link href="/(dashboard)/mortgage" className="hover:text-white transition">Mortgage Calculator</Link></li>
              <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          © 2024 AI Realty. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
