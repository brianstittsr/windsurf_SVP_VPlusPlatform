import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Users, Target, Briefcase, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Affiliate Network",
  description:
    "Join the Strategic Value+ affiliate network and help manufacturers become OEM-qualified suppliers through targeted execution and measurable outcomes.",
};

const benefits = [
  {
    title: "Aligned work, clear outcomes",
    description: "Work is organized around readiness milestones and measurable deliverables.",
    icon: Target,
  },
  {
    title: "High-trust introductions",
    description: "Manufacturers come in with real needs and a clear intent to improve.",
    icon: Users,
  },
  {
    title: "Protect your reputation",
    description: "Structured delivery reduces scope drift and improves client outcomes.",
    icon: ShieldCheck,
  },
];

const expectations = [
  "Deep expertise in a domain that impacts supplier readiness",
  "Professional delivery with clear communication",
  "Collaboration with SV+ team and other affiliates",
  "Commitment to measurable outcomes",
];

export default function AffiliatesPage() {
  return (
    <>
      <section className="py-20 md:py-28 bg-black text-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
              Affiliate Network
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Bring your expertise. <span className="text-primary">Help suppliers get qualified.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
              Join a delivery network focused on supplier readiness and OEM qualification. We match manufacturers to the
              right experts—when they need them—so progress is fast, accountable, and measurable.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/contact">
                  Apply / Start a Conversation
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
            {benefits.map((b) => (
              <div key={b.title} className="text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What we’re looking for</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Affiliates who can deliver value in supplier readiness programs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Common domains
                  </CardTitle>
                  <CardDescription>Quality, ISO/QMS, lean, automation, supply chain, finance, workforce.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground">
                    If you have a repeatable approach that helps manufacturers close readiness gaps, you’re a fit.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Expectations
                  </CardTitle>
                  <CardDescription>Professional delivery and collaborative execution.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {expectations.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Interested in joining?</h2>
          <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
            Tell us what you do best and the outcomes you deliver—we’ll follow up.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 text-lg px-8 bg-white text-primary hover:bg-white/90"
            asChild
          >
            <Link href="/contact">
              Apply now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
