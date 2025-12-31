import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wrench,
  ArrowRight,
  CheckCircle,
  Cog,
  Bot,
  FileCheck,
  Monitor,
  Users,
  Globe,
  Search,
  BarChart3,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "V+ EDGE™ - Modular Industry 4.0 Platform",
  description:
    "Start smart, build fast. V+ EDGE™ is your entry point to Industry 4.0 transformation with modular solutions for lean, automation, quality, and more.",
};

const modules = [
  {
    id: "lean",
    title: "V+ EDGE Lean",
    tagline: "Eliminate Waste. Maximize Value.",
    icon: Cog,
    description:
      "Implement proven lean manufacturing principles to reduce waste, improve flow, and increase productivity.",
    features: [
      "Value stream mapping and analysis",
      "5S workplace organization",
      "Kaizen continuous improvement",
      "Standard work development",
      "Visual management systems",
      "Pull system implementation",
    ],
    outcomes: [
      "20-40% reduction in lead time",
      "15-30% productivity improvement",
      "Significant waste reduction",
    ],
    href: "/v-edge",
  },
  {
    id: "automation",
    title: "V+ EDGE Automation",
    tagline: "Smart Automation. Real Results.",
    icon: Bot,
    description:
      "Introduce automation strategically with pilot programs that prove ROI before scaling.",
    features: [
      "Automation readiness assessment",
      "Pilot program design and execution",
      "Cobot integration",
      "Process automation",
      "ROI modeling and validation",
      "Scaling roadmap development",
    ],
    outcomes: [
      "Reduced labor costs",
      "Improved consistency and quality",
      "Increased throughput",
    ],
    href: "/v-edge",
  },
  {
    id: "quality",
    title: "V+ EDGE Quality",
    tagline: "Certify. Qualify. Win Contracts.",
    icon: FileCheck,
    description:
      "Achieve ISO certification and implement quality management systems that meet OEM requirements.",
    features: [
      "ISO 9001 implementation",
      "AS9100 aerospace certification",
      "IATF 16949 automotive certification",
      "QMS documentation and procedures",
      "Internal audit programs",
      "Supplier quality management",
    ],
    outcomes: [
      "ISO certification in 90 days",
      "OEM supplier qualification",
      "Reduced quality costs",
    ],
    href: "/v-edge",
  },
  {
    id: "digital",
    title: "V+ EDGE Digital",
    tagline: "Industry 4.0. Demystified.",
    icon: Monitor,
    description:
      "Adopt digital technologies without the complexity. MES-lite dashboards, IoT sensors, and data-driven insights.",
    features: [
      "MES-lite implementation",
      "Real-time production dashboards",
      "IoT sensor integration",
      "Data collection and analytics",
      "Digital work instructions",
      "Paperless shop floor",
    ],
    outcomes: [
      "Real-time visibility",
      "Data-driven decisions",
      "Reduced downtime",
    ],
    href: "/v-edge",
  },
  {
    id: "workforce",
    title: "V+ EDGE Workforce",
    tagline: "Build Your Future Team.",
    icon: Users,
    description:
      "Develop your workforce with training programs, skills matrices, and succession planning.",
    features: [
      "Skills gap analysis",
      "Training program development",
      "Cross-training matrices",
      "Leadership development",
      "Succession planning",
      "Performance management",
    ],
    outcomes: [
      "Reduced turnover",
      "Improved skills coverage",
      "Stronger leadership pipeline",
    ],
    href: "/v-edge",
  },
  {
    id: "reshore",
    title: "V+ EDGE Reshore",
    tagline: "Bring Manufacturing Home.",
    icon: Globe,
    description:
      "Navigate reshoring with confidence. Total cost analysis, supplier development, and transition planning.",
    features: [
      "Total Cost of Ownership analysis",
      "Reshoring feasibility studies",
      "Supplier identification and development",
      "Transition planning and execution",
      "Risk assessment and mitigation",
      "Government incentive navigation",
    ],
    outcomes: [
      "Reduced supply chain risk",
      "Improved lead times",
      "Access to incentives",
    ],
    href: "/v-edge",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Modular by Design",
    description: "Start with what you need most. Add modules as you grow. No massive upfront investment.",
  },
  {
    icon: BarChart3,
    title: "Measurable Results",
    description: "Every engagement includes real-time KPIs, ROI modeling, and transformation scorecards.",
  },
  {
    icon: Search,
    title: "No ERP Overhaul",
    description: "Our solutions work alongside your existing systems. No disruptive technology changes.",
  },
  {
    icon: Users,
    title: "Hands-On Implementation",
    description: "We don't just advise—we implement. Our team works alongside yours on the shop floor.",
  },
];

export default function VEdgePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-black text-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
              V+ EDGE™ Platform
            </Badge>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Start Smart.{" "}
              <span className="text-primary">Build Fast.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
              Your entry point to Industry 4.0 transformation. Modular solutions covering lean, 
              automation, quality, digital, workforce, and reshoring—designed for manufacturers 
              with 25 to 500 employees.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/contact">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 hover:bg-white/10" asChild>
                <Link href="#modules">
                  Explore Modules
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Choose Your Modules
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Each module delivers standalone value, but they're designed to work together 
              for comprehensive transformation.
            </p>
          </div>

          <Tabs defaultValue="lean" className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-transparent">
              {modules.map((module) => (
                <TabsTrigger
                  key={module.id}
                  value={module.id}
                  className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <module.icon className="h-5 w-5" />
                  <span className="text-xs">{module.title.replace("V+ EDGE ", "")}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {modules.map((module) => (
              <TabsContent key={module.id} value={module.id} className="mt-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                        <module.icon className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{module.title}</CardTitle>
                        <CardDescription className="text-base font-medium">
                          {module.tagline}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">{module.description}</p>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold mb-4">What's Included</h4>
                        <ul className="space-y-2">
                          {module.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-4">Expected Outcomes</h4>
                        <ul className="space-y-2">
                          {module.outcomes.map((outcome) => (
                            <li key={outcome} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                              <span className="font-medium">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                        <Button className="mt-6" asChild>
                          <Link href="/contact">
                            Request Assessment
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Start Your Transformation?
          </h2>
          <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
            Get a free assessment to identify which V+ EDGE modules will deliver 
            the greatest impact for your manufacturing operation.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 text-lg px-8 bg-white text-primary hover:bg-white/90"
            asChild
          >
            <Link href="/contact">
              Schedule Free Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
