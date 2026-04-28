"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Users,
  BarChart3,
  Shield,
  Globe,
  Phone,
  Mail,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Zap,
    title: "Power Assessment",
    description: "We evaluate power availability, substations, and grid capacity for data center operations.",
  },
  {
    icon: MapPin,
    title: "Location Analysis",
    description: "Comprehensive site assessment including zoning, fiber connectivity, and environmental factors.",
  },
  {
    icon: TrendingUp,
    title: "Maximize Value",
    description: "Turn your property into a high-value asset through our partnership with leading data center operators.",
  },
  {
    icon: Clock,
    title: "Fast Track",
    description: "Streamlined evaluation process with initial feedback within 5 business days.",
  },
];

const REQUIREMENTS = [
  "Minimum 20 acres of contiguous land or 100,000+ sq ft building",
  "Access to 50+ MW of power or proximity to substations",
  "Fiber connectivity or ability to bring fiber to site",
  "Industrial or commercial zoning",
  "Flat terrain suitable for construction",
  "Access to major highways and transportation corridors",
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Submit Your Location",
    description: "Complete our online form with property details, power information, and contact details.",
  },
  {
    step: "02",
    title: "Initial Review",
    description: "Our team reviews your submission and conducts preliminary site assessment within 5 business days.",
  },
  {
    step: "03",
    title: "Detailed Evaluation",
    description: "Qualified sites undergo comprehensive analysis including power studies, environmental review, and market assessment.",
  },
  {
    step: "04",
    title: "Partnership Opportunity",
    description: "Approved sites are matched with data center operators for development opportunities.",
  },
];

export default function ZenthiumPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black text-white min-h-[600px] flex items-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        <div className="relative z-10 py-20 md:py-32 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
              <Server className="h-4 w-4 mr-1" />
              Data Center Development Partnership
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Power the Future of
              <span className="text-primary"> Digital Infrastructure</span>
            </h1>
            
            <p className="mt-6 text-lg text-gray-300 md:text-xl max-w-2xl mx-auto">
              Do you have land or a facility suitable for data center development? 
              Partner with Zenthium and leading technology companies to transform 
              your property into a strategic digital asset.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/zenthium/submit">
                  Submit Your Location
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 hover:bg-white/10 text-white" asChild>
                <Link href="#how-it-works">
                  Learn How It Works
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">100+</div>
              <div className="mt-2 text-sm text-muted-foreground">Sites Evaluated</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">$2B+</div>
              <div className="mt-2 text-sm text-muted-foreground">Development Value</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">5 Days</div>
              <div className="mt-2 text-sm text-muted-foreground">Initial Response</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">15+</div>
              <div className="mt-2 text-sm text-muted-foreground">Partners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Why Partner With Zenthium?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              We connect property owners with the world&apos;s leading data center operators, 
              creating opportunities for significant value creation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((benefit) => (
              <Card key={benefit.title} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Requirements Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-6">
                What We&apos;re Looking For
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Ideal sites for data center development typically have these characteristics. 
                Don&apos;t worry if your property doesn&apos;t meet every criteria—each site is evaluated 
                on its unique merits.
              </p>
              
              <div className="space-y-4">
                {REQUIREMENTS.map((req, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{req}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-muted rounded-2xl p-8">
              <h3 className="font-semibold text-xl mb-6">Property Types We Accept</h3>
              <div className="space-y-4">
                {[
                  { icon: MapPin, label: "Vacant / Greenfield Land", desc: "Undeveloped parcels with utilities access" },
                  { icon: Building2, label: "Industrial Buildings", desc: "Warehouses, factories, distribution centers" },
                  { icon: Globe, label: "Brownfield Sites", desc: "Former industrial properties ready for redevelopment" },
                  { icon: Server, label: "Existing Data Centers", desc: "Facilities ready for expansion or retrofit" },
                ].map((type) => (
                  <div key={type.label} className="flex items-start gap-4 p-4 bg-background rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <type.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Process Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process makes it easy to submit your property and 
              connect with data center development opportunities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROCESS_STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="text-5xl font-bold text-primary/20 mb-4">{step.step}</div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button size="lg" asChild>
              <Link href="/zenthium/submit">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to Submit Your Property?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join property owners across the country who are partnering with Zenthium 
            to develop next-generation data center infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/zenthium/submit">
                Submit Your Location
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Questions? Contact our team:</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm">
              <a href="mailto:zenthium@strategicvalueplus.com" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                zenthium@strategicvalueplus.com
              </a>
              <a href="tel:+1-800-555-0199" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                1-800-555-0199
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>
            Zenthium is a division of Strategic Value Plus, Inc. helping property owners 
            connect with data center development opportunities across the United States.
          </p>
        </div>
      </section>
    </div>
  );
}
