<p align="center">
  <img src="apps/web/public/logo.svg" alt="Dalva Logo" width="120" height="120" />
</p>

<h1 align="center">Dalva</h1>

<p align="center">
  A privacy-first personal finance manager.<br/>
  Track accounts, transactions, budgets, debts, and savings goals — all in one place.
</p>

<p align="center">
  <strong>No bank integrations. The user is the source of truth.</strong>
</p>

---

## Overview

Dalva gives individuals complete visibility and control over their money — where it comes from, where it goes, what they owe, and what they're building toward.

### Core Modules

| Module | Description |
|--------|-------------|
| **Accounts** | Track all places where money lives (cash, bank, credit card, digital wallet) |
| **Transactions** | Record income, expenses, and transfers between accounts |
| **Categories** | Organize money movement with customizable categories and subcategories |
| **Budgets** | Set monthly spending limits per category with real-time feedback |
| **Goals** | Save toward targets with progress tracking and projections |
| **Debts** | Track loans and balances with paydown progress |
| **Dashboard** | Net worth, cashflow, budget summary, and reports at a glance |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | TanStack Start (SSR) + TanStack Router + React 19 + React Query |
| **Backend** | Convex (serverless, real-time sync) |
| **UI** | shadcn/ui v4 + Tailwind CSS v4 + Radix UI + Lucide Icons |
| **Auth** | Convex Auth (email/password, Google OAuth planned) |
| **Design** | Wise-inspired design system (Inter font, Forest Green + Bright Green palette) |
| **Package Manager** | Bun (workspaces) |
| **Testing** | Vitest + Testing Library |

---

## Monorepo Structure

```
my-personal-finance/
├── apps/web/          @mpf/web     — Frontend
├── packages/backend/  @mpf/backend — Convex backend
└── docs/                           — Product docs, PRD, design system
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Node.js](https://nodejs.org/) (v18+)
- A [Convex](https://convex.dev/) account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd my-personal-finance

# Install dependencies
bun install
```

### Environment Setup

Create `apps/web/.env.local`:

```env
VITE_CONVEX_URL=<your-convex-deployment-url>
```

### Development

```bash
# Start both frontend and backend
bun run dev

# Frontend only (port 3000)
bun run dev:web

# Convex dev server only
bun run dev:backend
```

### Build & Quality

```bash
# Build all apps
bun run build

# Type check all packages
bun run typecheck

# Lint all packages
bun run lint
```

---

## Project Status

**Stage:** Early development (Phase 1)

**Implemented:**
- Landing page with responsive navigation and dark mode toggle
- Sign in, sign up, and forgot password pages
- Convex Auth backend with email/password provider
- Protected dashboard route with auth gate
- Dark mode with localStorage persistence
- Wise-inspired design system with light and dark themes

**Up Next:**
- Onboarding flow
- Account management
- Categories and subcategories
- Transaction entry

See the full roadmap in [`docs/PRD.md`](docs/PRD.md).

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/business.md`](docs/business.md) | Product vision and module specs |
| [`docs/PRD.md`](docs/PRD.md) | Full product requirements |
| [`docs/design-system.md`](docs/design-system.md) | UI specification and design tokens |

---

## Design Principles

- **Privacy-first** — All data belongs to the user. No data is sold or used for advertising.
- **Manual-first** — No bank integrations required. The user controls all entries.
- **Offline-capable** — Enter transactions without connectivity; data syncs when connection is restored.
- **Cross-platform** — Consistent experience across web, mobile, and future clients.

---

## License

Private project. All rights reserved.
