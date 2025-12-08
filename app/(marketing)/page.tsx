import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { ServicesOverview } from "@/components/marketing/services-overview";
import { StatsSection } from "@/components/marketing/stats-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Testimonials } from "@/components/marketing/testimonials";
import { CTASection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <ServicesOverview />
      <StatsSection />
      <HowItWorks />
      <Testimonials />
      <CTASection />
    </>
  );
}
