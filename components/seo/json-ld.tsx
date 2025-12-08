import Script from "next/script";

// Organization Schema
export function OrganizationJsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Strategic Value+ Solutions",
    alternateName: "Strategic Value Plus",
    url: "https://strategicvalueplus.com",
    logo: "https://strategicvalueplus.com/logo.png",
    description:
      "We help small- and mid-sized U.S. manufacturers win OEM contracts through supplier qualification, ISO certification, and operational readiness.",
    foundingDate: "2020",
    founders: [
      {
        "@type": "Person",
        name: "Nel Varenas",
        jobTitle: "CEO",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+1-555-123-4567",
        contactType: "sales",
        availableLanguage: ["English"],
      },
      {
        "@type": "ContactPoint",
        email: "info@strategicvalueplus.com",
        contactType: "customer service",
      },
    ],
    sameAs: [
      "https://www.linkedin.com/company/strategicvalueplus",
      "https://twitter.com/strategicvalueplus",
      "https://www.youtube.com/@strategicvalueplus",
    ],
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    knowsAbout: [
      "Manufacturing Consulting",
      "ISO Certification",
      "IATF 16949",
      "Lean Manufacturing",
      "Industry 4.0",
      "Digital Transformation",
      "Supply Chain Optimization",
      "OEM Supplier Qualification",
    ],
  };

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  );
}

// Local Business Schema (for local SEO)
export function LocalBusinessJsonLd() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Strategic Value+ Solutions",
    image: "https://strategicvalueplus.com/logo.png",
    url: "https://strategicvalueplus.com",
    telephone: "+1-555-123-4567",
    email: "info@strategicvalueplus.com",
    priceRange: "$$$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 35.7796,
      longitude: -78.6382,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "47",
    },
  };

  return (
    <Script
      id="localbusiness-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
    />
  );
}

// Service Schema
interface ServiceJsonLdProps {
  name: string;
  description: string;
  url: string;
  provider?: string;
  areaServed?: string;
}

export function ServiceJsonLd({
  name,
  description,
  url,
  provider = "Strategic Value+ Solutions",
  areaServed = "United States",
}: ServiceJsonLdProps) {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    provider: {
      "@type": "Organization",
      name: provider,
      url: "https://strategicvalueplus.com",
    },
    areaServed: {
      "@type": "Country",
      name: areaServed,
    },
    serviceType: "Manufacturing Consulting",
  };

  return (
    <Script
      id={`service-jsonld-${name.toLowerCase().replace(/\s+/g, "-")}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
    />
  );
}

// FAQ Schema
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQJsonLdProps {
  faqs: FAQItem[];
}

export function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

// Breadcrumb Schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}

// Article/Blog Schema
interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
}

export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
}: ArticleJsonLdProps) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    image,
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Strategic Value+ Solutions",
      logo: {
        "@type": "ImageObject",
        url: "https://strategicvalueplus.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <Script
      id="article-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
    />
  );
}

// WebSite Schema with SearchAction
export function WebsiteJsonLd() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Strategic Value+",
    alternateName: "Strategic Value Plus Solutions",
    url: "https://strategicvalueplus.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://strategicvalueplus.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Script
      id="website-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
  );
}
