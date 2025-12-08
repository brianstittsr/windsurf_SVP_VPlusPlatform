"use client";

import { useState, useEffect, useCallback } from "react";
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
}

// Default slides - in production these would come from a database
const defaultSlides: HeroSlide[] = [
  {
    id: "1",
    badge: "Introducing EDGE-X™ — Next-Gen Manufacturing Intelligence",
    headline: "Win OEM Contracts.",
    highlightedText: "Transform",
    subheadline: "We help small- and mid-sized U.S. manufacturers become qualified suppliers through ISO certification, operational readiness, and supplier development.",
    benefits: ["OEM Supplier Qualification", "ISO/QMS Certification", "Industry 4.0 Ready"],
    primaryCta: { text: "Get Your Free Assessment", href: "/contact" },
    secondaryCta: { text: "See Success Stories", href: "/case-studies" },
    isPublished: true,
    order: 1,
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
    <section className="relative overflow-hidden bg-black text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      <div className="relative py-20 md:py-32 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
              <span className="text-primary">{currentSlide.highlightedText}</span> Your Manufacturing.
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
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 hover:bg-white/10" asChild>
                <Link href={currentSlide.secondaryCta.href}>
                  <Play className="mr-2 h-5 w-5" />
                  {currentSlide.secondaryCta.text}
                </Link>
              </Button>
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
            <p className="text-sm text-gray-400 mb-6">Trusted by manufacturers across the United States</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="h-8 w-24 bg-white/20 rounded" />
              <div className="h-8 w-28 bg-white/20 rounded" />
              <div className="h-8 w-20 bg-white/20 rounded" />
              <div className="h-8 w-32 bg-white/20 rounded" />
              <div className="h-8 w-24 bg-white/20 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
