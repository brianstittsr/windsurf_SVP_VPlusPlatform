export function SvpOrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Strategic Value Plus Solutions, LLC",
    alternateName: "V+",
    legalName: "Strategic Value Plus Solutions, LLC",
    url: "https://strategicvalueplus.com",
    logo: "https://strategicvalueplus.com/VPlus_logo.jpg",
    email: "info@strategicvalueplus.com",
    telephone: "+1-805-584-1157",
    description:
      "Strategic Value+ helps U.S. manufacturers qualify, comply and grow through the Four Gates: quality systems, cybersecurity, operations and compliance.",
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
    name: "V+ Academy",
    url: "https://strategicvalueplus.com",
    publisher: {
      "@type": "Organization",
      name: "Strategic Value Plus Solutions, LLC",
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
      name: "Strategic Value Plus Solutions, LLC",
      sameAs: "https://strategicvalueplus.com",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
