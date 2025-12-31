"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Wrench, Factory, Users, CheckCircle } from "lucide-react";

const services = [
  {
    title: "Supplier Readiness",
    tagline: "Close gaps. Get qualified.",
    description:
      "A structured program to move your company from capable to OEM-ready: assessment, roadmap, and stage-based execution toward qualification.",
    icon: Factory,
    color: "text-primary",
    bgColor: "bg-primary/10",
    href: "/contact",
    features: [
      "Readiness assessment and gap analysis",
      "Qualification roadmap with milestones",
      "Quality/ISO pathway and audit preparation",
      "Supplier development with targeted experts",
    ],
  },
  {
    title: "V+ EDGE™",
    tagline: "Execute the roadmap.",
    description:
      "A modular execution platform that supports readiness work across quality systems, operations discipline, and capability upgrades.",
    icon: Wrench,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    href: "/v-edge",
    features: [
      "Modular implementation for rapid progress",
      "KPIs and visibility for accountability",
      "Works with existing systems",
      "Scales as your readiness needs grow",
    ],
  },
  {
    title: "Affiliate Network",
    tagline: "Bring the right expertise.",
    description:
      "A vetted delivery network that matches your readiness gaps to specialized experts—so progress is fast and measurable.",
    icon: Users,
    color: "text-accent",
    bgColor: "bg-accent/10",
    href: "/affiliates",
    features: [
      "Targeted assignments by stage and need",
      "Clear deliverables and milestones",
      "Collaborative execution",
      "Designed for repeatable outcomes",
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
            Supplier Readiness for Manufacturers
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            The readiness path to OEM qualification
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with a readiness assessment and roadmap. Then execute improvements with the right experts and tools.
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
                    {service.title === "Supplier Readiness" ? "Request assessment" : "Learn more"}
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
              Request Supplier Readiness Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
