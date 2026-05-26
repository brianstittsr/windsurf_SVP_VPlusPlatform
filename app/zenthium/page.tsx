"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Zap,
  Network,
  Building2,
  ArrowRight,
  CheckCircle,
  Server,
  TrendingUp,
  Clock,
  Droplets,
  Wifi,
  Layers,
  Leaf,
  Grid,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
} from "lucide-react";

const SITE_REQUIREMENTS = [
  {
    icon: Layers,
    title: "Minimum 10,000 Square Feet",
    badge: "Required",
    badgeColor: "bg-orange-500",
    description:
      "The facility must offer at least 10,000 sq ft of usable floor space. Larger facilities (100,000+ sq ft) are strongly preferred for hyperscale deployments.",
  },
  {
    icon: Zap,
    title: "20+ Megawatts of Power",
    badge: "Required",
    badgeColor: "bg-orange-500",
    description:
      "The location must be able to receive or generate a minimum of 20 MW of electrical power on-site. Grid-connected, behind-the-meter, and renewable configurations are all considered.",
  },
  {
    icon: Building2,
    title: "High Ceilings (18 ft+ Clear Height)",
    badge: "Required",
    badgeColor: "bg-orange-500",
    description:
      "Data center infrastructure requires significant vertical clearance for server racks, cooling systems, and cable management. Minimum 18 ft clear ceiling height preferred.",
  },
  {
    icon: Grid,
    title: "Single-Story & Flat Floor",
    badge: "Required",
    badgeColor: "bg-orange-500",
    description:
      "The facility must be single-story with no elevated second floors. Data center equipment requires level, reinforced floor loading of 150–300 lbs/sq ft.",
  },
  {
    icon: MapPin,
    title: "Eligible Property Types",
    badge: "Required",
    badgeColor: "bg-orange-500",
    description:
      "We consider: vacant/greenfield land, vacant warehouses, industrial buildings, steel mills, decommissioned facilities, brownfield sites, and power-rich properties.",
  },
  {
    icon: Droplets,
    title: "Water Access for Cooling",
    badge: "Required",
    badgeColor: "bg-orange-500",
    description:
      "Cooling is one of the highest demands in data centers. Access to municipal water, reclaimed water, or on-site water sources (lakes, rivers) is a strong advantage.",
  },
  {
    icon: Wifi,
    title: "Fiber Connectivity",
    badge: "Preferred",
    badgeColor: "bg-gray-600",
    description:
      "Proximity to existing fiber infrastructure (dark or lit) from multiple carriers is preferred. Locations near major fiber routes or carrier hotels score higher.",
  },
  {
    icon: Layers,
    title: "Industrial or Commercial Zoning",
    badge: "Preferred",
    badgeColor: "bg-gray-600",
    description:
      "The property should be zoned for heavy industrial, light industrial, or commercial use. M-1, M-2, or equivalent zoning classifications are ideal.",
  },
  {
    icon: Leaf,
    title: "Environmental Clearance",
    badge: "Preferred",
    badgeColor: "bg-gray-600",
    description:
      "Phase I Environmental Site Assessment (ESA) completed with no known contamination preferred. Brownfield sites with documented remediation are also considered.",
  },
  {
    icon: Zap,
    title: "Grid Stability & Substation Access",
    badge: "Preferred",
    badgeColor: "bg-gray-600",
    description:
      "Proximity to a high-voltage substation (115kV or higher) or dedicated utility feed is critical. Redundant grid feeds or N+1 power configurations are ideal.",
  },
];

const FAQS = [
  {
    q: "What types of properties does Zenthium consider for data center deployment?",
    a: "Zenthium evaluates a wide range of property types including vacant/greenfield land, industrial warehouses, steel mills, decommissioned factories, gas plants, brownfield sites, and any property with significant power access. The key factors are power availability and structural suitability.",
  },
  {
    q: "What is the minimum power requirement?",
    a: "A minimum of 20 MW of available or deliverable power is required. Sites with 50 MW+ are strongly preferred. We work with both grid-connected properties and sites capable of on-site power generation.",
  },
  {
    q: "Does the building need to already exist, or can it be vacant land?",
    a: "Both are acceptable. Vacant land is ideal for ground-up hyperscale builds. Existing buildings can be evaluated for adaptive reuse, which can accelerate deployment timelines significantly.",
  },
  {
    q: "What lease terms does Zenthium offer?",
    a: "Zenthium structures 15 and 20-year NNN leases with built-in escalations. These are designed to provide property owners with stable, long-term revenue streams while allowing Zenthium to make the capital investments required for data center operations.",
  },
  {
    q: "Does the location need to be near a city or data center hub?",
    a: "Not necessarily. Hyperscalers are actively seeking locations in secondary and tertiary markets where power is abundant and land is affordable. Access to fiber and grid infrastructure matters more than proximity to population centers.",
  },
  {
    q: "What happens after I submit a location?",
    a: "Our team reviews every submission within 5 business days. Qualified sites proceed to a detailed technical evaluation including power studies, fiber assessment, zoning review, and market analysis. We communicate clearly at every step.",
  },
  {
    q: "Is water cooling mandatory?",
    a: "Not mandatory, but strongly preferred for hyperscale deployments. Sites with access to water sources (municipal, reclaimed, or on-site) score significantly higher and are more attractive to enterprise and hyperscale tenants.",
  },
  {
    q: "What is the typical size of a Zenthium data center deployment?",
    a: "Initial deployments start at 10–20 MW with scalable expansion paths to 100–500 MW+ depending on site capacity and tenant demand. Hyperscale customers often require 100 MW+ over time.",
  },
  {
    q: "Does Zenthium handle permitting and construction?",
    a: "Yes. Zenthium manages the full development lifecycle from site selection and permitting through construction and commissioning. Property owners provide the land and power access; we handle everything else.",
  },
  {
    q: "Who are Zenthium's customers?",
    a: "Zenthium works with global hyperscalers, Fortune 500 enterprises, AI infrastructure companies, and cloud service providers. Our demand pipeline represents 10+ GW of contracted and active deployment requirements.",
  },
];

const PARTNER_BENEFITS = [
  "10+ GW of contracted and active demand pipeline",
  "Direct relationships with hyperscalers and Fortune 500 companies",
  "Expertise in utility coordination and infrastructure execution",
  "Global expansion footprint across North America and beyond",
  "Strategic joint venture structure to maximize long-term asset value",
];

const LOCATION_TYPES = [
  "Commercial real estate owners",
  "Industrial property operators",
  "Landowners with existing power access",
  "Renewable energy operators with stranded power",
  "Upstream oil & gas power producers",
  "Brownfield and underutilizes industrial sites",
];

export default function ZenthiumPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[680px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Data center server room"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a0a0a]" />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <Badge className="mb-6 bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs uppercase tracking-widest">
            Strategic Value+ | Zenthium
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Powering the{" "}
            <span className="text-orange-400">AI Infrastructure</span>{" "}
            Revolution
          </h1>

          <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-4">
            Zenthium is at the forefront of the global AI and data infrastructure expansion. With{" "}
            <strong className="text-white">10+ gigawatts of demand</strong> from global hyperscalers
            and Fortune 500 companies, we are actively building the next generation of
            high-performance digital infrastructure across the globe.
          </p>
          <p className="text-gray-400 text-base max-w-2xl mx-auto mb-10">
            The opportunity is massive — and we are seeking strategic joint venture partners ready to build alongside us.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 text-base font-semibold" asChild>
              <Link href="/zenthium/submit">
                Submit a Location <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white px-8 text-base" asChild>
              <a href="https://zenthium.ai" target="_blank" rel="noopener noreferrer">
                Visit Zenthium.ai <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#111111] border-y border-white/10 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10+ GW", label: "Active Demand Pipeline" },
              { value: "20-yr", label: "Lease Commitments" },
              { value: "20+ MW", label: "Minimum Deployment" },
              { value: "F500", label: "Customer Base" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold text-orange-400">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Zenthium Delivers */}
      <section className="py-20 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">What Zenthium Delivers</h2>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            Zenthium secures and places long-term hyperscale and enterprise demand through structured, long-term partnerships.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "15 & 20-Year Leases",
                desc: "Long-term commitments that provide stable, predictable revenue for property owners.",
              },
              {
                icon: Zap,
                title: "10–20 MW+ Deployments",
                desc: "Minimum 10–20 MW deployments with scalable expansion paths to hundreds of MW.",
              },
              {
                icon: Server,
                title: "End-to-End Execution",
                desc: "From site identification through commissioning, Zenthium manages the full development lifecycle.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 text-left">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scale of Opportunity */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Data infrastructure"
            fill
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-black/70 to-[#0a0a0a]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-orange-400 text-xs uppercase tracking-widest font-semibold mb-4">The Scale of Opportunity</p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            The world needs 10x more data center capacity by 2030.
          </h2>
          <p className="text-gray-300 text-lg">
            AI workloads, cloud migration, and autonomous systems are creating an unprecedented infrastructure gap.
            Zenthium is actively closing it — one strategic site at a time.
          </p>
        </div>
      </section>

      {/* Looking for New Locations */}
      <section className="py-20 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-4">We Are Looking for New Data Center Locations</h2>
              <p className="text-gray-400 mb-4">
                Zenthium partners with owners of energy-rich properties and industrial assets to transform
                underutilized real estate into high-value digital infrastructure hubs. Whether it&apos;s a
                warehouse, steel mill, gas plant, industrial facility, or powered land — we bring the committed demand.
              </p>
              <p className="text-gray-400 mb-8">
                If you control power and want to participate in one of the fastest-growing sectors in history,
                now is the time. You supply the power. We&apos;ll bring the demand.
              </p>

              <div className="space-y-3 mb-8">
                {LOCATION_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{type}</span>
                  </div>
                ))}
              </div>

              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8" asChild>
                <Link href="/zenthium/submit">
                  Submit Your Location <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-6">
              <div className="relative h-48 rounded-xl overflow-hidden">
                <Image
                  src="https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Idle warehouses, steel mills, industrial facilities"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-white font-semibold text-sm">Idle warehouses, steel mills, industrial facilities</p>
                  <p className="text-gray-300 text-xs">Transform underutilized assets into high-value infrastructure</p>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-orange-500/20 rounded-xl p-6">
                <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Why Partner with Zenthium?
                </p>
                <div className="space-y-3">
                  {PARTNER_BENEFITS.map((b) => (
                    <div key={b} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Types of Sites */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-orange-400 text-xs uppercase tracking-widest font-semibold mb-10">
            The Types of Sites We Evaluate
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                img: "https://images.pexels.com/photos/236089/pexels-photo-236089.jpeg?auto=compress&cs=tinysrgb&w=800",
                title: "Power Substations & Grid Assets",
                sub: "High-voltage infrastructure",
              },
              {
                img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
                title: "Vacant Industrial Land",
                sub: "Greenfield & brownfield parcels",
              },
              {
                img: "https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=800",
                title: "Idle Warehouses & Mills",
                sub: "Adaptive reuse opportunities",
              },
            ].map((site) => (
              <div key={site.title} className="relative h-44 rounded-xl overflow-hidden group">
                <Image src={site.img} alt={site.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-semibold text-sm">{site.title}</p>
                  <p className="text-gray-400 text-xs">{site.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Site Requirements */}
      <section className="py-20 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Data Center Site Requirements</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm">
              Zenthium evaluates every location against the following criteria.
              Required items are non-negotiable; preferred items significantly improve a site&apos;s score and deployment timeline.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {SITE_REQUIREMENTS.map((req) => (
              <div key={req.title} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <req.icon className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-white">{req.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${req.badgeColor}`}>
                      {req.badge}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{req.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8" asChild>
              <Link href="/zenthium/submit">
                Submit a Location for Review <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Power Is the Asset */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Power grid infrastructure"
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0a] via-black/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md ml-auto text-right">
            <p className="text-orange-400 text-xs uppercase tracking-widest font-semibold mb-4">Power Is the Asset</p>
            <h2 className="text-4xl font-bold leading-tight mb-6">
              If you control power, you control the future.
            </h2>
            <p className="text-gray-300 text-base">
              Grid access, substations, and stranded energy are now the most sought-after real estate on earth.
              Zenthium turns your energy asset into long-term cash flow.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-sm">Everything you need to know about partnering with Zenthium.</p>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center px-5 py-4 text-left text-sm font-medium text-white hover:text-orange-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 ml-4 text-orange-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 ml-4 text-gray-400" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/10 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#111111] border-t border-white/10 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Partner with Zenthium?</h2>
          <p className="text-gray-400 mb-8">
            Submit your property today. Our team reviews every submission and responds within 5 business days.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 text-base font-semibold" asChild>
              <Link href="/zenthium/submit">
                Submit Your Location <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8" asChild>
              <Link href="/contact">
                Talk to Our Team
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
