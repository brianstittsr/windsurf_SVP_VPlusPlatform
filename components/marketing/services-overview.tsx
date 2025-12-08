"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Wrench, Cpu, Brain, CheckCircle } from "lucide-react";

const services = [
  {
    title: "V+ EDGE™",
    tagline: "Start Smart. Build Fast.",
    description:
      "Your entry point to transformation. Modular platform covering lean, automation, sustainability, quality, and workforce strategy.",
    icon: Wrench,
    color: "text-primary",
    bgColor: "bg-primary/10",
    href: "/v-edge",
    features: [
      "Hands-on implementation with real-time KPIs",
      "Modular design for immediate impact",
      "Ideal for companies with 25–500 employees",
      "No ERP overhaul required",
    ],
  },
  {
    title: "TwinEDGE™",
    tagline: "Simulate. Optimize. Reshore with Confidence.",
    description:
      "Digital twin technology for workflow modeling, scenario testing, and supply chain redesign before making costly changes.",
    icon: Cpu,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    href: "/twinedge",
    features: [
      "Predictive simulations & ROI modeling",
      "Smart reshoring and supply chain reengineering",
      "Factory layout and flow optimization",
      "Machine maintenance prediction",
    ],
  },
  {
    title: "IntellEDGE™",
    tagline: "Decide Smarter. Lead Stronger.",
    description:
      "Executive-grade decision-making tools with predictive analytics and AI-powered insights for leadership teams.",
    icon: Brain,
    color: "text-accent",
    bgColor: "bg-accent/10",
    href: "/intelledge",
    features: [
      "Data-driven real-time dashboards",
      "Prescriptive decision tools",
      "Scenario modeling for executive strategy",
      "Enhanced visibility and long-term planning",
    ],
  },
];

export function ServicesOverview() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4">
            Modular Industry 4.0/5.0 for Manufacturers
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            The EDGE™ Platform
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We help small- and mid-sized manufacturers drive real, scalable progress. 
            Start where you need it most — then expand with purpose, precision, and measurable results.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card key={service.title} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className={`absolute top-0 left-0 w-full h-1 ${service.bgColor}`} />
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${service.bgColor} flex items-center justify-center mb-4`}>
                  <service.icon className={`h-6 w-6 ${service.color}`} />
                </div>
                <CardTitle className="text-2xl">{service.title}</CardTitle>
                <CardDescription className="text-base font-medium">
                  {service.tagline}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${service.color}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" className="group/btn p-0 h-auto" asChild>
                  <Link href={service.href}>
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Not sure which solution is right for you?
          </p>
          <Button size="lg" asChild>
            <Link href="/contact">
              Schedule a Discovery Call
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
