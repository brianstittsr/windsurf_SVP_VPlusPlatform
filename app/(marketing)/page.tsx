import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  MonitorSmartphone,
  Award,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Self-Paced Learning",
    description:
      "Work through the AC1 Part 107 course on your schedule with progress tracking and the ability to resume training anytime.",
  },
  {
    icon: MonitorSmartphone,
    title: "Mobile-Friendly Access",
    description:
      "Secure student accounts with a responsive course interface that works on desktop, tablet, and mobile.",
  },
  {
    icon: BarChart3,
    title: "Assessments & Exams",
    description:
      "Module quizzes, knowledge checks, and randomized examinations with automated grading and feedback.",
  },
  {
    icon: Award,
    title: "Completion Certificates",
    description:
      "EFVS-branded course completion certificates with unique identification numbers, delivered by email and downloadable as PDF.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-[#071628] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <Image
            src="/images/hero.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#071628] via-[#071628]/80 to-transparent" />
        <div className="relative container py-24 md:py-36">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#56b8e8] font-display mb-4">
            EFVS UAS TRAINING ACADEMY
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[0.95] max-w-2xl">
            Training that leads beyond the exam.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-xl">
            Start with the FAA Part 107 knowledge foundation and continue into
            specialized UAS applications — mapping, LiDAR, regulatory waivers,
            and public safety.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#d3ac63] text-[#071628] hover:bg-[#e8c684] font-semibold"
            >
              <Link href="/pricing">
                Enroll Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 bg-transparent"
            >
              <Link href="/sign-in">Student Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Course highlight */}
      <section id="courses" className="py-20 md:py-28 bg-background">
        <div className="container">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#1478ac] font-display">
            LAUNCH COURSE
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-2 max-w-2xl">
            AC1 — FAA Part 107 Remote Pilot Certification Preparation
          </h2>
          <div className="mt-10 grid md:grid-cols-2 gap-10 items-center">
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/part107.jpg"
                alt="FAA Part 107 training"
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                The AC1 course prepares aspiring remote pilots for the FAA Part
                107 knowledge exam — covering regulations, airspace
                classification, weather, loading and performance, and
                operational procedures.
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  "Video instruction, presentations, and interactive materials",
                  "Module quizzes and randomized practice examinations",
                  "Progress tracking with the ability to resume training",
                  "EFVS completion certificate upon passing",
                  "Promotional pricing and military veteran discounts",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 mt-0.5 text-[#1478ac] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg">
                <Link href="/pricing">
                  Register for AC1 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="academy" className="py-20 bg-[#f8f7f1]">
        <div className="container">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#1478ac] font-display">
            THE ACADEMY
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-2">
            Built for aspiring pilots, veterans, agencies, and employers.
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-[#d9d8ce]">
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-[#1478ac]" />
                  <CardTitle className="font-display text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#071628] text-white">
        <div className="container text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Ready to begin?
          </h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Create your student account and start the AC1 Part 107 course today.
            Questions? Contact EFVS at{" "}
            <a
              href="mailto:info@efvertical.com"
              className="text-[#56b8e8] hover:underline"
            >
              info@efvertical.com
            </a>{" "}
            or 805-584-1157.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-[#d3ac63] text-[#071628] hover:bg-[#e8c684] font-semibold"
          >
            <Link href="/pricing">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-6 text-xs text-white/50 max-w-lg mx-auto">
            EFVS Academy certificates document completion of EFVS training. They
            do not constitute an FAA Remote Pilot Certificate, guarantee an FAA
            examination result, or replace the FAA certification process.
          </p>
        </div>
      </section>
    </>
  );
}
