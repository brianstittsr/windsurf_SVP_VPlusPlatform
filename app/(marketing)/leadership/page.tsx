import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Linkedin, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Leadership Team",
  description:
    "Meet the Strategic Value+ leadership team - veteran experts driving manufacturing transformation.",
};

const leadershipTeam = [
  {
    name: "Nel Varenas, MBA",
    title: "V+ CEO",
    image: "/team/nel-varenas.jpg",
    expertise: [
      "AI, Automation, & Digital Twins",
      "Reshoring",
      "Sales & Marketing",
      "ISO",
      "Six Sigma",
      "Affiliate Marketing",
    ],
  },
  {
    name: "Brian Stitt",
    title: "V+ CTO",
    image: "/team/brian-stitt.jpg",
    expertise: [
      "AI Visionary & Developer",
      "Digital Transformation Expert",
      "Robotics and Digital Twins Innovator",
    ],
  },
  {
    name: "Roy Dickan, BSIM",
    title: "V+ CRO",
    image: "/team/roy-dickan.jpg",
    expertise: [
      "AI Optimization Architect",
      "Automations",
      "Sales & Marketing",
      "Lead Generation",
      "Int/Ext Communication",
    ],
  },
  {
    name: "Dave McFarland",
    title: "V+ COO",
    image: "/team/dave-mcfarland.jpg",
    expertise: [
      "Operational & Financial Performance Improvement Advisor",
      "ISO 9001 Auditor",
      "Throughput Accounting",
      "TOC",
    ],
  },
];

export default function LeadershipPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-black text-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
              Our Leadership
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Leadership <span className="text-primary">Team</span>
            </h1>
            <p className="mt-6 text-xl text-gray-300">
              Veteran experts with decades of combined experience in manufacturing, 
              technology, and business transformation.
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Team Grid */}
      <section className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {leadershipTeam.map((member) => (
              <Card key={member.name} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="sm:w-48 sm:h-auto h-64 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold">
                        {member.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 flex-1">
                      <h3 className="text-2xl font-bold">{member.name}</h3>
                      <p className="text-lg text-primary font-semibold mt-1">{member.title}</p>
                      
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {member.expertise.map((skill) => (
                            <Badge 
                              key={skill} 
                              variant="secondary" 
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Work With Our Team?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Schedule a free consultation to discuss how our leadership team can help 
            transform your manufacturing operations.
          </p>
          <Button size="lg" className="mt-8 text-lg px-8" asChild>
            <Link href="/contact">
              Schedule a Consultation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
