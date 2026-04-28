"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  badge: string;
  headline: string;
  highlightedText: string;
  subheadline: string;
  benefits: string[];
  primaryCta: {
    text: string;
    href: string;
  };
  secondaryCta: {
    text: string;
    href: string;
  };
  isPublished: boolean;
  order: number;
  image?: string;
  imageAlt?: string;
}

// Default slides - in production these would come from a database
const defaultSlides: HeroSlide[] = [
  {
    id: "1",
    badge: "Supplier Readiness & OEM Qualification",
    headline: "Close the gaps.",
    highlightedText: "Win OEM Business",
    subheadline: "We help manufacturers with 25-500 employees close readiness gaps across quality, delivery, and compliance— so you can win and keep OEM business.",
    benefits: ["Readiness Assessment", "Qualification Roadmap", "Hands-on Execution"],
    primaryCta: { text: "Request Assessment", href: "/contact" },
    secondaryCta: { text: "For OEM Buyers", href: "/oem-buyers" },
    isPublished: true,
    order: 1,
    image: "/images/hero-manufacturing.svg",
    imageAlt: "Manufacturing worker in safety gear operating machinery",
  },
  {
    id: "2",
    badge: "V+ TwinEDGE™ — Digital Twin Solutions",
    headline: "Visualize Your Factory.",
    highlightedText: "Optimize",
    subheadline: "Create digital replicas of your manufacturing processes to simulate, analyze, and improve operations before making costly physical changes.",
    benefits: ["Real-time Monitoring", "Predictive Analytics", "Process Simulation"],
    primaryCta: { text: "Explore Digital Twins", href: "/services/twinedge" },
    secondaryCta: { text: "Watch Demo", href: "/demo" },
    isPublished: true,
    order: 2,
    image: "/images/hero-digital-twin.svg",
    imageAlt: "Digital twin visualization of factory operations",
  },
  {
    id: "3",
    badge: "V+ IntellEDGE™ — AI-Powered Insights",
    headline: "Make Smarter Decisions.",
    highlightedText: "Faster",
    subheadline: "Leverage artificial intelligence to gain actionable insights from your manufacturing data, predict maintenance needs, and optimize production schedules.",
    benefits: ["AI-Driven Analytics", "Predictive Maintenance", "Smart Scheduling"],
    primaryCta: { text: "Discover AI Solutions", href: "/services/intelledge" },
    secondaryCta: { text: "Learn More", href: "/about" },
    isPublished: true,
    order: 3,
    image: "/images/hero-ai-analytics.svg",
    imageAlt: "AI-powered manufacturing analytics dashboard",
  },
  {
    id: "4",
    badge: "Reshoring Initiative Partner",
    headline: "Bring Manufacturing",
    highlightedText: "Home",
    subheadline: "Join the reshoring movement. We help companies navigate the complexities of bringing manufacturing back to the United States with comprehensive support.",
    benefits: ["Supply Chain Security", "Quality Control", "Job Creation"],
    primaryCta: { text: "Start Reshoring", href: "/services/reshoring" },
    secondaryCta: { text: "View Case Studies", href: "/case-studies" },
    isPublished: true,
    order: 4,
    image: "/images/hero-reshoring.svg",
    imageAlt: "American manufacturing facility",
  },
  {
    id: "5",
    badge: "NEW — AntiFragile Supply Chain Analysis",
    headline: "Build Resilient",
    highlightedText: "Supply Chains",
    subheadline: "Go beyond risk mitigation. Our AntiFragile methodology helps your supply chain actually grow stronger from disruptions, volatility, and uncertainty.",
    benefits: ["Stress Testing", "Redundancy Mapping", "Adaptive Strategies"],
    primaryCta: { text: "Schedule Discovery Call", href: "/antifragile" },
    secondaryCta: { text: "Learn More", href: "/antifragile" },
    isPublished: true,
    order: 5,
    image: "/images/hero-supply-chain.svg",
    imageAlt: "Supply chain network visualization"
  },
  {
    id: "6",
    badge: "Zenthium — Data Center Partnership",
    headline: "Submit Your Location.",
    highlightedText: "Power the Future",
    subheadline: "Have land or a building suitable for data center development? We evaluate properties for hyperscale data center opportunities with leading technology partners.",
    benefits: ["Land Evaluation", "Power Assessment", "Fast Track to Market"],
    primaryCta: { text: "Submit Your Location", href: "/zenthium/submit" },
    secondaryCta: { text: "Learn More", href: "/zenthium" },
    isPublished: true,
    order: 6,
    image: "/images/hero-datacenter.svg",
    imageAlt: "Modern data center facility with servers and infrastructure"
  },
];

interface HeroCarouselProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number;
}

export function HeroCarousel({ slides = defaultSlides, autoPlayInterval = 6000 }: HeroCarouselProps) {
  const publishedSlides = slides.filter(s => s.isPublished).sort((a, b) => a.order - b.order);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % publishedSlides.length);
  }, [publishedSlides.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + publishedSlides.length) % publishedSlides.length);
  }, [publishedSlides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || publishedSlides.length <= 1) return;
    
    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, goToNext, publishedSlides.length]);

  if (publishedSlides.length === 0) {
    return null;
  }

  const currentSlide = publishedSlides[currentIndex];

  return (
    <section className="relative overflow-hidden bg-black text-white min-h-[700px] md:min-h-[800px] flex items-center">
      {/* Background Image */}
      {currentSlide.image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={currentSlide.image}
            alt={currentSlide.imageAlt || "Hero background"}
            fill
            className="object-cover opacity-70"
            priority={currentIndex === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        </div>
      )}
      
      {/* Background Pattern (fallback) */}
      {!currentSlide.image && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      )}
      
      <div className="relative z-10 py-20 md:py-32 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Slide Content with Fade Animation */}
          <div key={currentSlide.id} className="animate-in fade-in duration-500">
            {/* Badge */}
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
              {currentSlide.badge}
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {currentSlide.headline}{" "}
              <span className="text-primary">{currentSlide.highlightedText}</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg text-gray-300 md:text-xl max-w-2xl mx-auto">
              {currentSlide.subheadline}
            </p>

            {/* Key Benefits */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              {currentSlide.benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href={currentSlide.primaryCta.href}>
                  {currentSlide.primaryCta.text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {currentSlide.secondaryCta.text && (
                <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 hover:bg-white/10 text-white" asChild>
                  <Link href={currentSlide.secondaryCta.href}>
                    {currentSlide.secondaryCta.text}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Carousel Navigation */}
          {publishedSlides.length > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              {/* Prev Button */}
              <button
                onClick={() => { goToPrev(); setIsAutoPlaying(false); }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {publishedSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      index === currentIndex
                        ? "bg-primary w-8"
                        : "bg-white/30 hover:bg-white/50"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => { goToNext(); setIsAutoPlaying(false); }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-6">Certifications & Partnerships</p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
              <div className="flex flex-col items-center text-center">
                <span className="text-lg font-bold text-white">ISO 9001</span>
                <span className="text-xs text-gray-400">Certified</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-lg font-bold text-white">IATF 16949</span>
                <span className="text-xs text-gray-400">Automotive</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-lg font-bold text-white">MEP</span>
                <span className="text-xs text-gray-400">Network Partner</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-lg font-bold text-white">Reshoring</span>
                <span className="text-xs text-gray-400">Initiative</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-lg font-bold text-white">NIST</span>
                <span className="text-xs text-gray-400">Aligned</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
