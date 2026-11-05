export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Eagle Flight Vertical Solutions",
    alternateName: "EFVS",
    legalName: "Aviante HWC, Inc. dba Eagle Flight Vertical Solutions",
    url: "https://www.efvertical.com",
    logo: "https://academy.efvertical.com/images/efvs-logo.png",
    email: "info@efvertical.com",
    telephone: "+1-805-584-1157",
    description:
      "EFVS connects aviation regulation, infrastructure, operations, technology, and workforce development for UAS and Advanced Air Mobility.",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "EFVS UAS Training Academy",
    url: "https://academy.efvertical.com",
    publisher: {
      "@type": "Organization",
      name: "Eagle Flight Vertical Solutions",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function CourseJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "AC1 — FAA Part 107 Remote Pilot Certification Preparation",
    description:
      "Self-paced FAA Part 107 Remote Pilot certification preparation course covering regulations, airspace, weather, operations, and exam practice.",
    provider: {
      "@type": "Organization",
      name: "Eagle Flight Vertical Solutions",
      sameAs: "https://www.efvertical.com",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
