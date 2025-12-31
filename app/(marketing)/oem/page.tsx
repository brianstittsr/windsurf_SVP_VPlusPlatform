import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Factory, ShieldCheck, Timer, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "For OEM Buyers",
  description:
    "Strategic Value+ helps OEMs qualify and develop supplier capacity through a readiness program designed for small and mid-sized manufacturers.",
};

const outcomes = [
  {
    title: "Increase supplier qualification throughput",
    description: "A structured pipeline to move suppliers from interest to approved readiness milestones.",
    icon: Timer,
  },
  {
    title: "Reduce supply chain risk",
    description: "Develop domestic and nearshore capacity with measurable readiness indicators.",
    icon: ShieldCheck,
  },
  {
    title: "Expand supplier capacity",
    description: "Unlock capable manufacturers and close gaps across quality, delivery, and compliance.",
    icon: Factory,
  },
];

const program = [
  "Readiness assessment and gap analysis",
  "Qualification roadmap with milestones and accountability",
  "Quality/ISO pathway and audit preparation support",
  "Affiliate network for targeted expert execution",
  "Portfolio reporting and stage-based visibility",
];

export default function OEMPage() {
  return (
    <>
      <section className="py-20 md:py-28 bg-black text-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
              For OEM Buyers
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Qualify suppliers faster. <span className="text-primary">Build capacity with confidence.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
              Strategic Value+ runs a supplier readiness program that helps capable manufacturers meet OEM requirements—
              with clear stages, measurable deliverables, and hands-on execution support.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/contact">
                  Discuss a Supplier Program
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 hover:bg-white/10" asChild>
                <Link href="/">See Manufacturer Path</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {outcomes.map((o) => (
              <div key={o.title} className="text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <o.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{o.title}</h3>
                <p className="text-sm text-muted-foreground">{o.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What the program includes</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                A readiness pipeline that aligns suppliers to OEM expectations and produces actionable visibility.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Supplier Development
                  </CardTitle>
                  <CardDescription>Hands-on execution with the right expertise at each milestone.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {program.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-primary" />
                    Visibility & Governance
                  </CardTitle>
                  <CardDescription>Stage-based reporting that drives accountability.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Get a consistent readiness view across suppliers: stage, deliverable completion, and support needs.
                  </p>
                  <Button asChild>
                    <Link href="/contact">
                      Request a walkthrough
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to build supplier capacity?</h2>
          <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
            Let’s talk about your supply base, target requirements, and how a readiness program can reduce risk.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 text-lg px-8 bg-white text-primary hover:bg-white/90"
            asChild
          >
            <Link href="/contact">
              Talk to our team
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
