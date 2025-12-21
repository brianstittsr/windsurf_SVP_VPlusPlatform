# Supplier Search Standard Operating Procedure (SOP)

## Overview

This document outlines the standard operating procedure for using the Supplier Search feature in the Strategic Value Plus (SVP) Platform. The Supplier Search integrates with **ThomasNet** for supplier discovery and **Apollo.io** for contact enrichment.

---

## Table of Contents

1. [Supplier Discovery (ThomasNet)](#1-supplier-discovery-thomasnet)
2. [Contact Enrichment (Apollo.io)](#2-contact-enrichment-apolloio)
3. [Apollo.io Pricing & Credit Costs](#3-apolloio-pricing--credit-costs)
4. [Best Practices](#4-best-practices)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Supplier Discovery (ThomasNet)

### 1.1 Accessing Supplier Search

1. Navigate to **Portal → Supplier Search** in the SVP Platform
2. You will see multiple search options:
   - **AI Chat** - Natural language search
   - **All Suppliers** - Keyword-based search with region filter
   - **By Name** - Search by company name
   - **By Brand** - Search by brand name
   - **Product Catalogs** - Browse product catalogs

### 1.2 Performing a Search

1. **Enter your search query** (e.g., "CNC machining suppliers")
2. **Select a region** (optional):
   - All Regions
   - Northeast
   - Southeast
   - Midwest
   - Southwest
   - West
3. Click **Search All Suppliers**

### 1.3 Search Results

- Results are sourced from **ThomasNet.com**
- Each result includes:
  - Company name
  - Description
  - Location
  - Link to ThomasNet profile
- Results can be saved to custom lists for later reference

### 1.4 Saving Suppliers to Lists

1. Click **Save to List** on any supplier card
2. Select an existing list or create a new one
3. Saved suppliers appear in the **Saved Lists** tab

---

## 2. Contact Enrichment (Apollo.io)

### 2.1 Overview

Apollo.io is used to find and reveal contact information (emails and phone numbers) for decision-makers at supplier companies.

### 2.2 Searching for Contacts

1. Navigate to **Portal → Apollo Search**
2. Enter search criteria:
   - **Keywords** (e.g., "Purchasing Manager")
   - **Company name**
   - **Location**
   - **Industry**
3. Click **Search**

### 2.3 Revealing Contact Information

#### Email Reveal
1. Find a contact in search results
2. Click the **Email** button (envelope icon)
3. The system will:
   - First check Apollo's saved contacts (FREE - no credits used)
   - If not found, use `people/enrich` endpoint (USES CREDITS)
4. Email is displayed and saved to your list

#### Phone Reveal
1. Find a contact in search results
2. Click the **Phone** button (phone icon)
3. The system will:
   - First check Apollo's saved contacts (FREE - no credits used)
   - If not found, use `people/enrich` endpoint (USES CREDITS)
4. Phone number is displayed and saved to your list

### 2.4 Credit-Saving Strategy

The SVP Platform is optimized to minimize credit usage:

1. **Saved Contacts Check** - Before spending credits, the system checks if the contact was previously enriched in Apollo's saved contacts database
2. **Firebase Caching** - Revealed data is stored in Firebase, so re-accessing the same contact doesn't use additional credits
3. **Batch Operations** - Plan your enrichment to avoid duplicate lookups

---

## 3. Apollo.io Pricing & Credit Costs

### 3.1 Subscription Plans

| Plan | Monthly (per user) | Annual (per user) | Mobile Credits/mo | Export Credits/mo |
|------|-------------------|-------------------|-------------------|-------------------|
| **Free** | $0 | $0 | 5 | 10 |
| **Basic** | $59 | $49 | 75 | 1,000 |
| **Professional** | $99 | $79 | 100 | 2,000 |
| **Organization** | $149 | $119 | 200 | 4,000 |

*Note: Email credits are unlimited on all plans (subject to fair use policy)*

### 3.2 Credit Costs Per Action

| Action | Credit Cost |
|--------|-------------|
| **View/Reveal Email** | 1 email credit (unlimited on paid plans) |
| **Reveal Mobile Phone** | 1 mobile credit |
| **Export to CRM/CSV** | 1 export credit |
| **API Enrichment** | 1 credit per field revealed |

### 3.3 Additional Credit Purchases

If you exceed your monthly allocation:

| Credit Type | Cost |
|-------------|------|
| **Per Credit** | $0.20 |
| **Minimum Purchase (Monthly)** | 250 credits ($50) |
| **Minimum Purchase (Annual)** | 2,500 credits ($500) |

### 3.4 Cost Examples

| Scenario | Credits Used | Estimated Cost |
|----------|--------------|----------------|
| Reveal 100 emails | 0 (unlimited) | $0 |
| Reveal 100 mobile phones | 100 mobile credits | Included in plan or ~$20 |
| Export 500 contacts to CRM | 500 export credits | Included in plan |
| Reveal 1,000 mobiles (Basic plan) | 1,000 - 75 = 925 extra | ~$185 |

### 3.5 Fair Use Policy

- **Free accounts (corporate email)**: 10,000 email credits/month
- **Free accounts (personal email)**: 100 email credits/month
- **Paid accounts**: Lesser of ($ paid ÷ $0.025) or 1 million credits/year

### 3.6 Important Notes

- ⚠️ **Credits expire** at the end of each billing cycle
- ⚠️ **No refunds** for unused credits
- ⚠️ **Seat reductions** not allowed mid-term
- ⚠️ **Credits are charged** even if data is incorrect or unavailable

---

## 4. Best Practices

### 4.1 Minimize Credit Usage

1. **Check saved contacts first** - The system does this automatically
2. **Use saved lists** - Avoid re-revealing the same contacts
3. **Batch your searches** - Plan enrichment campaigns in advance
4. **Prioritize high-value contacts** - Focus on decision-makers

### 4.2 Optimize Search Results

1. **Use specific keywords** - "CNC machining" vs just "machining"
2. **Add location filters** - Narrow results by region
3. **Include certifications** - "ISO 9001", "AS9100", etc.
4. **Specify company size** - Filter by employee count

### 4.3 Data Quality

1. **Verify contact info** - Apollo data may be outdated
2. **Cross-reference** - Check LinkedIn profiles
3. **Update regularly** - Re-enrich contacts periodically
4. **Report errors** - Flag incorrect data in Apollo

---

## 5. Troubleshooting

### 5.1 "Email/Phone Not Available"

**Possible causes:**
- Contact not in Apollo's database
- Data not yet enriched
- API key restrictions (some endpoints require higher-tier plans)

**Solutions:**
1. Try searching by LinkedIn URL
2. Check if contact exists in Apollo directly
3. Verify API key permissions

### 5.2 "API Inaccessible"

**Cause:** The `people/enrich` endpoint requires a paid Apollo plan

**Solution:** 
- Upgrade to a paid Apollo plan
- Use the `contacts/search` endpoint for already-saved contacts (free)

### 5.3 Slow Search Results

**Cause:** ThomasNet scraping takes time

**Solution:**
- Wait for results to load (first search may take 5-10 seconds)
- Use more specific search terms to reduce result set

### 5.4 Missing Supplier Data

**Cause:** ThomasNet may block automated requests

**Solution:**
- Retry the search
- Use category-based search instead of keyword search
- Check ThomasNet directly for comparison

---

## Appendix: API Endpoints Used

### ThomasNet
- **Search URL**: `https://www.thomasnet.com/suppliers/search?searchterm={query}`
- **Method**: Puppeteer-based web scraping

### Apollo.io
| Endpoint | Purpose | Credits |
|----------|---------|---------|
| `contacts/search` | Search saved contacts | FREE |
| `people/enrich` | Reveal email/phone | 1 credit |
| `people/match` | Match by name/company | 1 credit |

---

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Created** | December 21, 2024 |
| **Author** | SVP Platform Team |
| **Last Updated** | December 21, 2024 |

---

*For questions or support, contact the SVP Platform administrator.*
