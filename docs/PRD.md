# Product Requirements Document

## 1. Product Overview

**Product name:** TBD  
**Product type:** Personal finance management platform  
**Vision:** Help individuals understand, plan, and control their money through a simple, cross-platform personal finance system.

The product enables users to track accounts, record transactions, manage budgets, monitor debts, save toward goals, and view financial dashboards. It should feel simple for daily use while supporting a robust financial model underneath.

---

## 2. Problem Statement

Most personal finance tools fail in one of two ways:

1. They are too simplistic and do not support real-life money management across accounts, debts, budgets, and savings goals.
2. They are too complex, spreadsheet-like, or overly dependent on bank integrations.

Users need a tool that is:

- simple enough for frequent use
- flexible enough to reflect real financial life
- available across devices
- reliable as a source of truth for their finances

---

## 3. Goals

### Primary Goals

- Give users a clear view of where their money is, where it went, and whether they are on track.
- Support daily transaction entry and account management.
- Help users plan using budgets, debt tracking, and savings goals.
- Provide a synced experience across multiple clients.

### Secondary Goals

- Support manual-first workflows without requiring bank integrations.
- Make the UI approachable for non-technical users.
- Build a strong foundation for later reporting, automation, and integrations.

---

## 4. Non-Goals

For the initial product, the following are out of scope unless explicitly prioritized later:

- direct bank integrations
- investment portfolio analysis
- tax filing features
- business accounting
- invoicing
- advanced multi-entity bookkeeping
- AI-driven financial advice

---

## 5. Target Users

### Primary Users

- Individuals managing personal finances manually
- Users with multiple accounts, debts, and savings goals
- Users who want a simple but complete money management system

### Secondary Users

- Couples or households sharing finances
- Users managing both digital and cash expenses
- Users who need cross-device access

---

## 6. Core Product Principles

- **Manual-first:** The product must be usable without any bank connection.
- **Simple UI, strong model:** Complexity should live in the data model, not in the user experience.
- **Cross-platform:** The same financial system should work across web, mobile, desktop, and future clients.
- **Trustworthy balances:** Accounts, transfers, and adjustments must be modeled clearly enough to preserve confidence in balances and reports.
- **Planning-oriented:** The product should help users make decisions, not just store records.

---

## 7. Key User Outcomes

Users should be able to:

- create and manage all their financial accounts
- record income, expenses, and transfers
- organize money using categories and subcategories
- understand cash flow through dashboards and reports
- create and track budgets
- manage debt balances and payments
- create and fund savings goals
- access the same data on multiple devices

---

## 8. Features

### 8.1 Authentication and User Account

Users can:

- sign up with email/password
- sign in with social providers such as Google and Apple
- reset password
- manage sessions across devices
- update profile settings
- set currency, timezone, and locale
- export their data
- delete their account

### 8.2 Onboarding

Users can:

- complete a welcome/setup flow
- choose a base currency
- create initial accounts
- create or accept starter categories
- optionally import existing data
- configure initial budgets, debts, and goals

### 8.3 Account Management

Users can:

- create multiple financial accounts
- define account types such as cash, checking, savings, credit card, loan, investment, or e-wallet
- set opening balances
- view current balances
- archive or close accounts
- customize account name, color, and icon
- manually adjust balances
- transfer funds between accounts
- reconcile system balance with real balance

### 8.4 Transaction Management

Users can:

- add income, expense, transfer, adjustment, debt payment, and savings contribution entries
- assign amount, date, account, category, subcategory, note, tags, payee, and attachments
- edit and delete transactions
- split a single transaction across multiple categories
- duplicate transactions
- create recurring transactions
- search, sort, and filter transactions
- bulk edit or bulk delete transactions

### 8.5 Categories and Classification

Users can:

- create custom income and expense categories
- create subcategories
- apply tags
- customize category icons/colors
- archive categories
- reassign transactions before deleting categories
- use categories consistently across budgets and reports

### 8.6 Budgets

Users can:

- create monthly, weekly, or custom-period budgets
- assign budgets by category
- view actual vs budgeted spending
- see remaining available budget
- receive overspending alerts
- optionally use budget rollover
- reuse budget templates
- view budget history

### 8.7 Debt Management

Users can:

- create debt records manually
- define debt type, original amount, current balance, interest rate, minimum payment, due date, and lender
- record debt payments
- distinguish principal and interest if needed
- view payoff progress
- use payoff strategies such as snowball or avalanche
- review payment history
- see debt reduction trends

### 8.8 Savings Goals

Users can:

- create one or more savings goals
- define target amount and target date
- link a goal to an account or use a virtual tracked amount
- contribute funds manually
- track progress toward completion
- view remaining amount and time
- see whether they are on track

### 8.9 Dashboard and Analytics

Users can view:

- total balance across accounts
- income vs expense summary
- cash flow trends
- spending by category
- spending by account
- budget progress
- debt overview
- savings goal progress
- recent transactions
- period comparisons
- customizable dashboard widgets

### 8.10 Reports

Users can generate:

- monthly financial reports
- category spending reports
- income reports
- account balance history
- debt reports
- savings reports
- custom date-range reports
- CSV or PDF exports

### 8.11 Recurring and Scheduled Activity

Users can:

- create recurring income, expenses, transfers, debt payments, and goal contributions
- receive reminders for scheduled entries
- mark recurring items as completed or skipped
- auto-create pending scheduled items

### 8.12 Search and Filters

Users can:

- search globally across transactions and entities
- filter by date, account, category, tag, type, and amount range
- save useful views/filters

### 8.13 Import and Export

Users can:

- import transactions from CSV
- export data to CSV or Excel
- map imported columns
- detect likely duplicates
- back up full data

### 8.14 Sync and Multi-Platform

The system must support:

- cloud sync
- near real-time synchronization
- offline-capable entry
- conflict handling
- consistent data across web, mobile, desktop, and future clients

### 8.15 Notifications and Reminders

Users can receive:

- budget threshold alerts
- bill reminders
- debt payment reminders
- savings goal reminders
- spending alerts
- periodic summary notifications

### 8.16 Personalization

Users can:

- enable dark mode/light mode
- customize dashboard layout
- set default account and categories
- use localized formats and language preferences
- configure multi-currency display where supported

### 8.17 Collaboration

Later or optionally, users may:

- create shared household workspaces
- invite other members
- assign roles such as owner, editor, viewer
- share accounts, budgets, and activity history

### 8.18 Security and Privacy

The system must support:

- encryption in transit
- encryption at rest
- secure authentication
- optional 2FA
- device/session management
- audit visibility for sensitive actions
- privacy-respectful data handling

---

## 9. Functional Requirements

### Must-Have for MVP

- user authentication
- onboarding
- account creation and management
- categories and subcategories
- transaction creation and editing
- transfers between accounts
- dashboard summary
- monthly budgeting
- debt tracking
- savings goals
- recurring transactions
- cloud sync across at least web and mobile

### Should-Have Soon After MVP

- advanced reports
- CSV import/export
- notifications/reminders
- account reconciliation
- budget rollover
- saved filters/views

### Could-Have Later

- shared household workspaces
- browser extension
- desktop app
- bank integrations
- OCR receipt scanning
- AI categorization suggestions

---

## 10. UX Requirements

The product must:

- feel simple and uncluttered
- support very fast transaction entry
- work well on mobile and desktop
- minimize the number of steps for common tasks
- avoid accounting jargon where possible
- present dashboards in plain, useful language
- preserve trust through clear balances and transaction history

### Design System

The UI follows a **Wise-inspired design system** built on shadcn/ui + Tailwind CSS v4. See [Design System](design-system.md) for the full specification, including:

- **Typography:** Inter (body/UI) with Wise Sans placeholder (display headlines)
- **Colors:** Forest Green + Bright Green brand palette mapped to semantic tokens
- **Spacing:** 8px grid aligned with Wise's foundational spacing scale
- **Radius:** Bold, generous border radii (10-60px scale)
- **Components:** shadcn/ui `radix-nova` style with Wise-aligned sizing

### Key UX Flows

- sign up and create first account
- add first income/expense
- transfer money between accounts
- create a budget
- add a debt and record payment
- create a savings goal and contribute to it
- review dashboard at a glance

---

## 11. Data Model Overview

Core entities likely include:

- User
- Profile
- Workspace or Personal DALVA
- Account
- Transaction
- Transaction Split
- Category
- Subcategory
- Tag
- Budget
- Budget Period
- Debt
- Debt Payment
- Savings Goal
- Goal Contribution
- Recurring Transaction
- Notification
- Attachment

Important modeling rules:

- transfers must affect both source and destination accounts
- balance adjustments must be traceable
- category deletion must preserve historical reporting integrity
- debts and goals should connect to transaction history where possible
- reports should derive from the same core DALVA events

---

## 12. Success Metrics

### Product Metrics

- weekly active users
- number of transactions created per active user
- number of accounts per user
- budget adoption rate
- debt tracking adoption rate
- savings goal adoption rate
- sync success rate
- retention after onboarding

### Experience Metrics

- time to first transaction
- onboarding completion rate
- failed sync/conflict rate
- crash-free sessions
- average time to log a transaction

---

## 13. Risks

- scope grows too quickly
- sync complexity introduces trust issues
- balances become unreliable if transfers/adjustments are modeled poorly
- too much flexibility harms reporting consistency
- UI becomes too complex as features expand
- security/privacy expectations are high for financial data

---

## 14. Release Strategy

### Phase 1: Personal DALVA

- auth
- accounts
- categories
- transactions
- transfers
- dashboard

### Phase 2: Planning

- budgets
- debts
- savings goals
- recurring transactions
- reminders

### Phase 3: Ecosystem

- stronger sync
- more clients/platforms
- imports/exports
- richer reports
- collaboration

---

## 15. Open Questions

- Should savings goals represent real segregated account balances, virtual allocations, or both?
- Should debt payments be modeled as specialized transactions or linked standalone records backed by transactions?
- What is the minimum sync model that preserves trust across devices?
- Should the product support multiple currencies in MVP or only one base currency?
- Should collaboration be part of the early roadmap or postponed?
- How much reporting is needed in MVP versus later phases?

---

## 16. Recommended MVP Definition

The smallest complete version should include:

- authentication
- onboarding
- account management
- categories and subcategories
- transaction entry and editing
- transfers
- dashboard overview
- monthly budgets
- debt tracking
- savings goals
- recurring transactions
- sync across web and mobile

---

## Appendix: Feature Matrix

| Feature           | MVP | Phase 2 | Later |
| ----------------- | --- | ------- | ----- |
| Auth              | ✓   |         |       |
| Onboarding        | ✓   |         |       |
| Accounts          | ✓   |         |       |
| Categories        | ✓   |         |       |
| Transactions      | ✓   |         |       |
| Transfers         | ✓   |         |       |
| Dashboard         | ✓   |         |       |
| Budgets           | ✓   |         |       |
| Debts             | ✓   |         |       |
| Savings Goals     | ✓   |         |       |
| Recurring         | ✓   |         |       |
| Sync              | ✓   |         |       |
| Reports           |     | ✓       |       |
| Import/Export     |     | ✓       |       |
| Notifications     |     | ✓       |       |
| Reconciliation    |     | ✓       |       |
| Budget Rollover   |     | ✓       |       |
| Saved Views       |     | ✓       |       |
| Collaboration     |     |         | ✓     |
| Browser Extension |     |         | ✓     |
| Desktop App       |     |         | ✓     |
| Bank Integration  |     |         | ✓     |
| OCR Receipts      |     |         | ✓     |
| AI Categorization |     |         | ✓     |
