# Strategic Value+ Platform

A modern **Next.js 14+** application serving as both a **marketing website** and an **intelligent business orchestration platform** for Strategic Value Plus.

## Overview

Strategic Value+ helps small- and mid-sized U.S. manufacturers (25-500 employees) win OEM contracts through supplier qualification, ISO certification, and operational readiness.

This platform unifies:
- **Marketing Website** - Lead capture, service showcase, event promotion
- **Business Portal** - Command center, pipeline management, affiliate coordination
- **AI Intelligence** - Natural language queries across business data

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
svp-platform/
├── app/
│   ├── (marketing)/          # Public marketing pages
│   │   ├── page.tsx          # Homepage
│   │   ├── about/
│   │   ├── contact/
│   │   ├── v-edge/
│   │   └── ...
│   ├── (portal)/             # Authenticated portal
│   │   └── portal/
│   │       ├── command-center/
│   │       ├── opportunities/
│   │       ├── projects/
│   │       ├── affiliates/
│   │       ├── customers/
│   │       ├── meetings/
│   │       ├── rocks/
│   │       ├── documents/
│   │       └── ask/          # AI query interface
│   ├── api/                  # API routes
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── marketing/            # Marketing page components
│   ├── portal/               # Portal components
│   └── shared/               # Shared components
├── lib/                      # Utilities
├── types/                    # TypeScript types
└── public/                   # Static assets
```

## Key Features

### Marketing Website
- **Homepage** with hero, services overview, testimonials
- **Service Pages** for V+ EDGE, TwinEDGE, IntellEDGE
- **Contact Form** with lead capture
- **About Page** with team and mission

### Business Portal
- **Command Center** - Real-time dashboard with pipeline, projects, rocks
- **Opportunities** - Sales pipeline management
- **Projects** - Active engagement tracking
- **Affiliates** - Network capability directory
- **Customers** - CRM functionality
- **Meetings** - Schedule and AI-extracted insights
- **Rocks** - 90-day goal tracking (EOS methodology)
- **Documents** - File management and sharing
- **Ask IntellEDGE** - AI-powered business queries

## Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI
OPENAI_API_KEY="sk-..."

# Integrations (Phase 2)
GHL_API_KEY="..."
FIREFLIES_API_KEY="..."
MATTERMOST_URL="..."

# Accessibility (UserWay)
NEXT_PUBLIC_USERWAY_ACCOUNT_ID="your-userway-account-id"
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

Or use the Vercel Dashboard for automatic deployments from GitHub.

## Roadmap

### Phase 1 (Current)
- [x] Marketing website
- [x] Portal layout and navigation
- [x] Command Center dashboard
- [x] Core portal pages (opportunities, projects, affiliates, etc.)
- [x] Ask IntellEDGE UI

### Phase 2 (Next)
- [ ] Authentication with NextAuth.js
- [ ] Database integration with Prisma
- [ ] Go High Level CRM integration
- [ ] FireFlies meeting intelligence

### Phase 3 (Future)
- [ ] Mattermost integration
- [ ] Real AI-powered queries
- [ ] Affiliate matching engine
- [ ] Customer portal

## License

Proprietary - Strategic Value+ Solutions

## Contact

- Website: [strategicvalueplus.com](https://strategicvalueplus.com)
- Email: info@strategicvalueplus.com
