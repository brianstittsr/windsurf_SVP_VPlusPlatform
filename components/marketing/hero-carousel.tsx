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
    badge: "Supplier Readiness & OEM Qualification",
    headline: "Become OEM-ready.",
    highlightedText: "Qualify",
    subheadline: "We help manufacturers with 25–500 employees close readiness gaps across quality, delivery, and compliance—so you can win and keep OEM business.",
    benefits: ["Readiness Assessment", "Qualification Roadmap", "Hands-on Execution"],
    primaryCta: { text: "Request Assessment", href: "/contact" },
    secondaryCta: { text: "For OEM Buyers", href: "/oem" },
    isPublished: true,
    order: 1,
  },
  {
    id: "2",
    badge: "V+ EDGE™ Platform",
    headline: "Execute the roadmap.",
    highlightedText: "Improve",
    subheadline: "V+ EDGE helps you implement readiness improvements with modular execution across quality systems, operational discipline, and capability upgrades.",
    benefits: ["Modular Execution", "KPIs & Visibility", "No ERP Overhaul"],
    primaryCta: { text: "Explore V+ EDGE", href: "/v-edge" },
    secondaryCta: { text: "Request Assessment", href: "/contact" },
    isPublished: true,
    order: 2,
  },
  {
    id: "3",
    badge: "Affiliate Network",
    headline: "Bring the right experts.",
    highlightedText: "Faster",
    subheadline: "We match readiness needs to targeted specialists—so the right work gets done at the right stage without wasting time.",
    benefits: ["Targeted Expertise", "Accountable Milestones", "Repeatable Delivery"],
    primaryCta: { text: "Join Affiliate Network", href: "/affiliates" },
    secondaryCta: { text: "Request Assessment", href: "/contact" },
    isPublished: true,
    order: 3,
  },
  {
    id: "4",
    badge: "For OEM Buyers",
    headline: "Build supplier capacity.",
    highlightedText: "Confidently",
    subheadline: "OEMs use our supplier readiness pipeline to qualify suppliers faster, reduce risk, and expand domestic capacity with stage-based visibility.",
    benefits: ["Supplier Pipeline", "Risk Reduction", "Measured Readiness"],
    primaryCta: { text: "See OEM Program", href: "/oem" },
    secondaryCta: { text: "Talk to our team", href: "/contact" },
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
            <div className="mt-10 flex justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href={currentSlide.primaryCta.href}>
                  {currentSlide.primaryCta.text}
                  <ArrowRight className="ml-2 h-5 w-5" />
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
