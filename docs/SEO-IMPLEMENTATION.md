# SEO Implementation Guide

## Overview

This document outlines the SEO implementation for the Strategic Value+ platform, including completed changes and action items for optimal search engine visibility.

---

## Completed SEO Implementations

### 1. Metadata Configuration (`app/layout.tsx`)

✅ **Enhanced metadata object with:**
- `metadataBase` - Base URL for relative URLs
- Expanded `keywords` array (13 targeted keywords)
- `authors`, `creator`, `publisher` fields
- `formatDetection` - Disabled auto-detection for cleaner display
- `alternates.canonical` - Canonical URL to prevent duplicate content
- `robots` configuration with GoogleBot-specific settings
- Enhanced `openGraph` with images
- Enhanced `twitter` card with creator handle
- `verification` placeholder for Google Search Console
- `category` for content classification

### 2. Dynamic Sitemap (`app/sitemap.ts`)

✅ **Auto-generated sitemap.xml with:**
- All static marketing pages
- Service pages with priority weighting
- `lastModified` timestamps
- `changeFrequency` settings
- Priority scores (1.0 for homepage, 0.9 for services, 0.8 for others)

### 3. Robots.txt (`app/robots.ts`)

✅ **Configured with:**
- Allow all public pages
- Disallow `/portal/`, `/api/`, `/_next/`, `/admin/`
- Sitemap reference
- Host declaration

### 4. Web App Manifest (`app/manifest.ts`)

✅ **PWA-ready manifest with:**
- App name and short name
- Theme colors matching brand
- Icon definitions
- Display mode settings

### 5. Structured Data / JSON-LD (`components/seo/json-ld.tsx`)

✅ **Rich snippets support:**
- `OrganizationJsonLd` - Company information
- `LocalBusinessJsonLd` - Local SEO
- `WebsiteJsonLd` - Site-wide schema with search action
- `ServiceJsonLd` - Individual service pages
- `FAQJsonLd` - FAQ pages
- `BreadcrumbJsonLd` - Navigation breadcrumbs
- `ArticleJsonLd` - Blog posts

---

## Action Items Required

### High Priority

#### 1. Create OG Image
```
Location: public/og-image.png
Size: 1200x630 pixels
Content: Brand logo, tagline, visual representation
```

#### 2. Create Favicon Set
```
Location: public/
Files needed:
- favicon.ico (48x48)
- icons/icon-192x192.png
- icons/icon-512x512.png
- apple-touch-icon.png (180x180)
```

#### 3. Google Search Console Verification
```
1. Go to https://search.google.com/search-console
2. Add property: https://strategicvalueplus.com
3. Get verification code
4. Update app/layout.tsx:
   verification: {
     google: "YOUR_ACTUAL_CODE",
   }
```

#### 4. Add Page-Specific Metadata
Each page should export its own metadata:

```tsx
// Example: app/(marketing)/services/page.tsx
export const metadata: Metadata = {
  title: "Manufacturing Consulting Services",
  description: "Comprehensive manufacturing consulting including ISO certification, lean manufacturing, and digital transformation.",
  alternates: {
    canonical: "https://strategicvalueplus.com/services",
  },
};
```

### Medium Priority

#### 5. Image Optimization
- Add `alt` text to all images
- Use Next.js `<Image>` component with proper sizing
- Implement lazy loading for below-fold images
- Use WebP format where possible

#### 6. Internal Linking Strategy
- Add related service links on each page
- Implement breadcrumb navigation
- Create hub pages for main topics

#### 7. Content Optimization
- Ensure H1 tags on every page (only one per page)
- Use H2-H6 hierarchy properly
- Target 1500+ words on key service pages
- Include target keywords naturally

### Lower Priority

#### 8. Performance Optimizations
- Enable Next.js Image optimization
- Implement font subsetting
- Use dynamic imports for heavy components
- Enable compression

#### 9. Analytics Setup
```tsx
// Add to app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

// In layout:
<GoogleAnalytics gaId="G-XXXXXXXXXX" />
```

#### 10. Additional Structured Data
- Add `Review` schema when testimonials are real
- Add `Event` schema for webinars/events
- Add `HowTo` schema for guides

---

## SEO Checklist by Page Type

### Homepage
- [x] Title tag with brand + value proposition
- [x] Meta description (150-160 chars)
- [x] H1 with primary keyword
- [x] Organization schema
- [ ] OG image
- [ ] Internal links to key services

### Service Pages
- [ ] Unique title for each service
- [ ] Service-specific meta description
- [ ] Service schema markup
- [ ] FAQ section with FAQ schema
- [ ] Related services links
- [ ] CTA with contact form

### Blog/Resource Pages
- [ ] Article schema
- [ ] Author information
- [ ] Publish/modified dates
- [ ] Category/tag structure
- [ ] Social sharing buttons

---

## Technical SEO Settings

### Next.js Config Recommendations

```js
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
};
```

### Headers for Security & SEO

```js
// next.config.js headers
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ];
}
```

---

## Monitoring & Reporting

### Tools to Set Up
1. **Google Search Console** - Index status, search performance
2. **Google Analytics 4** - Traffic and behavior
3. **Bing Webmaster Tools** - Bing search visibility
4. **PageSpeed Insights** - Performance monitoring

### Key Metrics to Track
- Organic traffic growth
- Keyword rankings for target terms
- Core Web Vitals scores
- Crawl errors
- Index coverage

---

## Target Keywords

### Primary Keywords
1. manufacturing consulting
2. OEM supplier qualification
3. ISO certification services
4. IATF 16949 certification
5. lean manufacturing consulting

### Secondary Keywords
1. digital transformation manufacturing
2. Industry 4.0 consulting
3. reshoring services
4. supply chain optimization
5. Toyota supplier qualification
6. automotive supplier readiness
7. digital twin manufacturing
8. AI manufacturing solutions

### Long-tail Keywords
1. "how to become a Toyota supplier"
2. "ISO 9001 certification for manufacturers"
3. "lean manufacturing consultant near me"
4. "small manufacturer digital transformation"
5. "OEM supplier qualification process"

---

## PageSpeed Insights Recommendations

To run a PageSpeed Insights report:

1. **URL**: https://pagespeed.web.dev/
2. **Enter**: Your deployed URL (e.g., https://strategicvalueplus.com)

### Expected Optimizations Needed:

#### Performance
- [ ] Optimize images (use Next.js Image component)
- [ ] Minimize JavaScript bundles
- [ ] Enable text compression
- [ ] Reduce unused CSS
- [ ] Defer non-critical JavaScript

#### Accessibility
- [x] Skip link implemented
- [x] ARIA labels on interactive elements
- [x] Color contrast compliance
- [x] Focus indicators

#### Best Practices
- [ ] HTTPS (ensure SSL certificate)
- [ ] No console errors
- [ ] Proper image aspect ratios

#### SEO
- [x] Meta description
- [x] Title tag
- [x] Robots.txt
- [x] Sitemap
- [x] Canonical URLs
- [ ] Structured data validation

---

## Next Steps

1. Deploy the site to production
2. Submit sitemap to Google Search Console
3. Run PageSpeed Insights on live URL
4. Create and upload OG image and favicons
5. Add page-specific metadata to all pages
6. Set up Google Analytics 4
7. Monitor Search Console for indexing issues

---

*Last Updated: December 7, 2024*
