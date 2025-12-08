import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Target,
  Eye,
  Heart,
  Users,
  Award,
  Factory,
  ArrowRight,
  Linkedin,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Strategic Value+ and our mission to transform U.S. manufacturing through supplier qualification, ISO certification, and operational excellence.",
};

const values = [
  {
    icon: Target,
    title: "Results-Driven",
    description:
      "We measure success by your success. Every engagement is focused on delivering measurable ROI and tangible business outcomes.",
  },
  {
    icon: Users,
    title: "Network Empowerment",
    description:
      "We leverage our affiliate ecosystem to bring the right expertise to every project, maximizing value for our clients.",
  },
  {
    icon: Heart,
    title: "Partnership Mindset",
    description:
      "We're not just consultants—we're partners invested in your long-term success and growth.",
  },
  {
    icon: Award,
    title: "Excellence in Execution",
    description:
      "We combine deep industry expertise with hands-on implementation to ensure every project succeeds.",
  },
];

const team = [
  {
    name: "Leadership Team Member",
    role: "CEO & Founder",
    bio: "20+ years in manufacturing consulting and supplier development.",
    avatar: "/team/ceo.jpg",
    linkedin: "#",
  },
  {
    name: "Operations Lead",
    role: "VP Operations",
    bio: "Expert in lean manufacturing and Industry 4.0 transformation.",
    avatar: "/team/ops.jpg",
    linkedin: "#",
  },
  {
    name: "Quality Director",
    role: "Director of Quality",
    bio: "ISO Lead Auditor with extensive QMS implementation experience.",
    avatar: "/team/quality.jpg",
    linkedin: "#",
  },
  {
    name: "Technology Lead",
    role: "CTO",
    bio: "Specializes in digital twin technology and manufacturing automation.",
    avatar: "/team/cto.jpg",
    linkedin: "#",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-black text-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
              About Strategic Value+
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Transforming U.S. Manufacturing,{" "}
              <span className="text-primary">One Supplier at a Time</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
              We're on a mission to strengthen American manufacturing by helping small 
              and mid-sized companies become world-class OEM suppliers.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground">
                  To empower small and mid-sized U.S. manufacturers to compete and win 
                  in the global marketplace by providing accessible, results-driven 
                  transformation services that bridge the gap between current capabilities 
                  and OEM requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6">
                  <Eye className="h-6 w-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground">
                  A thriving American manufacturing sector where every capable company 
                  has the opportunity to become a qualified supplier, creating jobs, 
                  strengthening supply chains, and driving economic growth across the nation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Story</h2>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Strategic Value+ was founded with a simple observation: too many capable 
                American manufacturers were being left behind. While large enterprises had 
                access to world-class consulting and transformation resources, small and 
                mid-sized manufacturers—the backbone of American industry—often struggled 
                to meet the increasingly complex requirements of OEM customers.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mt-6">
                We built Strategic Value+ to change that. By creating a modular, accessible 
                approach to manufacturing transformation and leveraging a network of expert 
                affiliates, we've made enterprise-grade capabilities available to companies 
                with 25 to 500 employees.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mt-6">
                Today, we've helped over 150 manufacturers achieve supplier qualification, 
                win OEM contracts, and transform their operations. But we're just getting 
                started. Our vision is to be the catalyst for a new era of American 
                manufacturing excellence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Values</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <Card key={value.title} className="text-center">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Leadership Team</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Experienced professionals dedicated to your success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {team.map((member) => (
              <Card key={member.name} className="overflow-hidden">
                <CardContent className="p-6 text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-primary text-sm font-medium">{member.role}</p>
                  <p className="text-muted-foreground text-sm mt-2">{member.bio}</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={member.linkedin}>
                        <Linkedin className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="#">
                        <Mail className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container text-center">
          <Factory className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Transform Your Manufacturing?
          </h2>
          <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
            Join the growing community of manufacturers who've partnered with 
            Strategic Value+ to achieve their goals.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 text-lg px-8 bg-white text-primary hover:bg-white/90"
            asChild
          >
            <Link href="/contact">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
