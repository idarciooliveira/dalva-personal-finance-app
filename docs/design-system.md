# Design System

> Wise-inspired design system for the DALVA personal finance app.
> Based on [wise.design](https://wise.design/foundations) foundations, adapted for shadcn/ui + Tailwind CSS v4.

---

## Overview

Our design system draws from Wise's product design language: clean, bold, and globally accessible. We use **Inter** as our primary typeface, a **green-centric** brand palette, generous border radii, and an 8px spacing grid.

All design tokens are defined in `apps/web/src/styles.css` using Tailwind CSS v4's CSS-first `@theme` configuration. No `tailwind.config.ts` file exists -- everything is in CSS.

### Stack

| Layer             | Tool                                                    |
| ----------------- | ------------------------------------------------------- |
| CSS Framework     | Tailwind CSS v4 (CSS-first, `@tailwindcss/vite` plugin) |
| Component Library | shadcn/ui v4 (`radix-nova` style)                       |
| Variant System    | CVA (class-variance-authority)                          |
| Class Merging     | `tailwind-merge` + `clsx` via `cn()` utility            |
| Icons             | Lucide React                                            |

---

## Typography

### Fonts

| Token            | Font                        | Weights                            | Usage                                                                                                                            |
| ---------------- | --------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--font-sans`    | **Inter**                   | 400, 500 (Medium), 600 (Semi Bold) | All body text, UI elements, headings                                                                                             |
| `--font-heading` | References `--font-sans`    | 600 (Semi Bold)                    | Section headings (use `font-semibold`)                                                                                           |
| `--font-display` | **Wise Sans** (placeholder) | --                                 | Display/hero headlines only. Currently falls back to `ui-sans-serif, system-ui, sans-serif`. Self-host Wise Sans when available. |

### Usage Guidelines

- Use **Inter Medium (500)** for body text and UI labels
- Use **Inter Semi Bold (600)** for headings, buttons, and emphasis
- Left-align or center-align text; never justify
- Keep line lengths between 50-60 characters
- Do not use Inter in all caps for body text

### Tailwind Classes

```html
<!-- Body text -->
<p class="font-sans text-base font-medium">...</p>

<!-- Heading -->
<h2 class="font-heading text-xl font-semibold">...</h2>

<!-- Display headline (when Wise Sans is available) -->
<h1 class="font-display text-4xl uppercase">...</h1>
```

---

## Colors

### Core Brand Colors

| Name         | Hex       | CSS Variable                | Tailwind Class         |
| ------------ | --------- | --------------------------- | ---------------------- |
| Bright Green | `#9FE870` | `--color-wise-bright-green` | `bg-wise-bright-green` |
| Forest Green | `#163300` | `--color-wise-forest-green` | `bg-wise-forest-green` |

### Semantic Color Mapping

Colors are mapped from Wise's product color system to shadcn/ui's semantic token slots.

| Token                    | Wise Source                         | Value                 | Usage                                 |
| ------------------------ | ----------------------------------- | --------------------- | ------------------------------------- |
| `--primary`              | Interactive Primary (Forest Green)  | `#163300`             | Primary buttons, links, focus rings   |
| `--primary-foreground`   | Interactive Contrast (Bright Green) | `#9FE870`             | Text on primary surfaces              |
| `--accent`               | Interactive Accent (Bright Green)   | `#9FE870`             | CTA buttons, highlights               |
| `--accent-foreground`    | Interactive Control (Forest Green)  | `#163300`             | Text on accent surfaces               |
| `--secondary`            | Background Neutral                  | `rgba(22,51,0,0.08)`  | Secondary buttons, subtle backgrounds |
| `--secondary-foreground` | Content Primary                     | `#0E0F0C`             | Text on secondary surfaces            |
| `--muted`                | Background Neutral                  | `rgba(22,51,0,0.08)`  | Muted backgrounds, disabled states    |
| `--muted-foreground`     | Content Secondary                   | `#454745`             | Secondary text, descriptions          |
| `--destructive`          | Sentiment Negative                  | `#A8200D`             | Error states, destructive actions     |
| `--background`           | Background Screen                   | `#FFFFFF`             | Page background                       |
| `--foreground`           | Content Primary                     | `#0E0F0C`             | Primary text color                    |
| `--card`                 | Background Elevated                 | `#FFFFFF`             | Card backgrounds                      |
| `--border`               | Border Neutral                      | `rgba(14,15,12,0.12)` | Borders, dividers                     |
| `--input`                | Interactive Secondary               | `#868685`             | Input borders                         |
| `--ring`                 | Interactive Primary                 | `#163300`             | Focus ring color                      |

### Extended Brand Palette

Available for marketing elements, charts, and illustrations. Use sparingly in product UI.

| Name          | Hex       | Class                   |
| ------------- | --------- | ----------------------- |
| Bright Orange | `#FFC091` | `bg-wise-bright-orange` |
| Bright Yellow | `#FFEB69` | `bg-wise-bright-yellow` |
| Bright Blue   | `#A0E1E1` | `bg-wise-bright-blue`   |
| Bright Pink   | `#FFD7EF` | `bg-wise-bright-pink`   |
| Dark Purple   | `#260A2F` | `bg-wise-dark-purple`   |
| Dark Gold     | `#3A341C` | `bg-wise-dark-gold`     |
| Dark Charcoal | `#21231D` | `bg-wise-dark-charcoal` |
| Dark Maroon   | `#320707` | `bg-wise-dark-maroon`   |

### Sentiment Colors

| Name     | Hex       | Class              |
| -------- | --------- | ------------------ |
| Positive | `#2F5711` | `bg-wise-positive` |
| Warning  | `#EDC843` | `bg-wise-warning`  |
| Negative | `#A8200D` | `bg-wise-negative` |

### Chart Colors

Charts use the secondary brand palette for visual variety:

| Token       | Color         | Value     |
| ----------- | ------------- | --------- |
| `--chart-1` | Bright Green  | `#9FE870` |
| `--chart-2` | Bright Blue   | `#A0E1E1` |
| `--chart-3` | Bright Orange | `#FFC091` |
| `--chart-4` | Bright Yellow | `#FFEB69` |
| `--chart-5` | Bright Pink   | `#FFD7EF` |

### Color Balance

Follow Wise's color hierarchy in product screens:

1. **White** -- most prominent, let screens breathe
2. **Background Neutral** -- warm separation between elements
3. **Content greys** -- text hierarchy (`#0E0F0C`, `#454745`, `#6A6C6A`)
4. **Forest Green** -- interactive elements (sparingly)
5. **Bright Green** -- accent highlights (very sparingly)

### Dark Mode

Dark mode is **not yet configured**. The `@custom-variant dark` directive is in place and ready for implementation. When adding dark mode, follow Wise's approach: invert surfaces to dark greens/charcoals while keeping Bright Green as the accent color.

---

## Border Radius

Wise uses bold, generous radii. Our base value is `--radius: 1.25rem` (20px).

### Scale

| Token          | Desktop     | Tailwind Class |
| -------------- | ----------- | -------------- |
| `--radius-sm`  | 10px        | `rounded-sm`   |
| `--radius-md`  | 16px        | `rounded-md`   |
| `--radius-lg`  | 20px (base) | `rounded-lg`   |
| `--radius-xl`  | 30px        | `rounded-xl`   |
| `--radius-2xl` | 40px        | `rounded-2xl`  |
| `--radius-3xl` | 60px        | `rounded-3xl`  |

### Usage

- **Buttons:** `rounded-lg` (default) to `rounded-xl` (large)
- **Cards:** `rounded-xl` to `rounded-2xl`
- **Modals/sheets:** `rounded-2xl`
- **Chips/badges:** `rounded-lg`
- **Inputs:** `rounded-lg`

---

## Spacing

We use an **8px grid** aligned with Wise's foundational spacing scale. Tailwind's default spacing (where `1 = 4px`) maps directly.

### Foundational Scale

| Wise Token | Value | Tailwind                   |
| ---------- | ----- | -------------------------- |
| `size-4`   | 4px   | `1` (e.g., `gap-1`, `p-1`) |
| `size-8`   | 8px   | `2`                        |
| `size-12`  | 12px  | `3`                        |
| `size-16`  | 16px  | `4`                        |
| `size-24`  | 24px  | `6`                        |
| `size-32`  | 32px  | `8`                        |
| `size-40`  | 40px  | `10`                       |
| `size-48`  | 48px  | `12`                       |

### Semantic Spacing Tokens

These are available as CSS custom properties for use with `var()` or via Tailwind's arbitrary value syntax.

| Token                         | Value | Usage                                  |
| ----------------------------- | ----- | -------------------------------------- |
| `--spacing-between-text`      | 8px   | Between title and body text            |
| `--spacing-between-chips`     | 8px   | Between chip/tag elements              |
| `--spacing-between-cards`     | 12px  | Between horizontally scrolling cards   |
| `--spacing-component-default` | 16px  | Default spacing between components     |
| `--spacing-text-to-component` | 16px  | Between text and a component below it  |
| `--spacing-screen-mobile`     | 24px  | Mobile screen horizontal padding       |
| `--spacing-content-to-button` | 24px  | Between form content and action button |
| `--spacing-between-sections`  | 32px  | Between major page sections            |

### Padding Tokens (Wise)

| Name              | Value        | Usage                                              |
| ----------------- | ------------ | -------------------------------------------------- |
| `padding-x-small` | 8px (`p-2`)  | Tight spacing within compact elements              |
| `padding-small`   | 16px (`p-4`) | Cards, compact data, footers (mobile)              |
| `padding-medium`  | 24px (`p-6`) | Variable height content, alerts, footers (desktop) |
| `padding-large`   | 32px (`p-8`) | Large containers, section padding                  |

---

## Component Sizing

### Size Tokens

| Token               | Value | Tailwind  |
| ------------------- | ----- | --------- |
| `--size-icon`       | 24px  | `size-6`  |
| `--size-avatar-sm`  | 24px  | `size-6`  |
| `--size-avatar-md`  | 40px  | `size-10` |
| `--size-avatar-lg`  | 48px  | `size-12` |
| `--size-avatar-xl`  | 56px  | `size-14` |
| `--size-avatar-2xl` | 72px  | `size-18` |
| `--size-button-sm`  | 32px  | `h-8`     |
| `--size-button-md`  | 48px  | `h-12`    |
| `--size-button-lg`  | 56px  | `h-14`    |

### Button Sizes

| Size      | Height        | Usage                                     |
| --------- | ------------- | ----------------------------------------- |
| `sm`      | 32px (`h-8`)  | Secondary actions, inline controls, chips |
| `default` | 48px (`h-12`) | Primary actions, form submissions         |
| `lg`      | 56px (`h-14`) | Hero CTAs, prominent actions              |

### Button Variants

| Variant       | Appearance                         | Usage                   |
| ------------- | ---------------------------------- | ----------------------- |
| `default`     | Forest Green bg, Bright Green text | Primary actions         |
| `accent`      | Bright Green bg, Forest Green text | CTA / highlight actions |
| `outline`     | Border only, transparent bg        | Secondary actions       |
| `secondary`   | Neutral bg                         | Tertiary actions        |
| `ghost`       | No border or bg                    | Inline/subtle actions   |
| `destructive` | Red tinted                         | Delete, remove actions  |
| `link`        | Underlined text                    | Navigation links        |

---

## Form Dialog Pattern

All product forms should default to the same modal pattern used in `apps/web/src/components/accounts/account-form-dialog.tsx`.

### Principles

- Use a clean dialog shell with `p-0`, `gap-0`, `overflow-hidden`, and a `max-w-md` width unless the content clearly needs more space
- Keep the header simple: title only, with `px-5 pt-5 pb-0`
- Make the primary value or amount input prominent at the top when the form has one, using a large text treatment with a bottom border instead of a standard boxed input
- Structure the rest of the form as icon-led rows separated by bottom borders
- Prefer inline, lightweight inputs (`bg-transparent`, no boxed field chrome) inside those rows
- Keep validation errors inside the content area just above the footer actions
- Use a footer action bar aligned right with `px-5 py-4 mt-2` and `size="default"` buttons
- Use `accent` for the primary action and `outline` for the secondary action

### Layout Reference

- Dialog shell: `max-w-md p-0 gap-0 overflow-hidden`
- Header: `px-5 pt-5 pb-0`
- Content: `px-5 pt-4 pb-0`
- Field rows: `flex items-center gap-3 border-b border-border py-3`
- Footer: `flex items-center justify-end gap-3 px-5 py-4 mt-2`

### Notes

- This is the default pattern for create, edit, and adjustment flows across the app
- Use conventional boxed inputs only when the interaction would be less clear in the row-based layout
- Keep the design consistent across accounts, transactions, budgets, goals, debts, and future onboarding forms

---

## Grid System

Based on Wise's responsive grid. Max content width is **1440px**.

| Name | Range       | Columns | Margin   | Gutter |
| ---- | ----------- | ------- | -------- | ------ |
| XS   | 320-479px   | 6       | 20px     | 12px   |
| S    | 480-767px   | 6       | 32px     | 12px   |
| M    | 768-991px   | 12      | 40px     | 16px   |
| L    | 992-1199px  | 12      | 80px     | 28px   |
| XL   | 1200-1440px | 12      | 100px    | 32px   |
| XXL  | 1440px+     | --      | Centered | --     |

We use Tailwind's default breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`) which are close enough for product use. Use `max-w-[1440px] mx-auto` for full-width containers.

---

## File Reference

| File                                    | Purpose                                                             |
| --------------------------------------- | ------------------------------------------------------------------- |
| `apps/web/src/styles.css`               | All design tokens: fonts, colors, radius, spacing, sizing           |
| `apps/web/src/lib/utils.ts`             | `cn()` utility for merging Tailwind classes                         |
| `apps/web/src/components/ui/button.tsx` | Button component with Wise-aligned variants and sizes               |
| `apps/web/components.json`              | shadcn/ui configuration (`radix-nova` style, CSS variables enabled) |

---

## Adding New shadcn Components

When adding new shadcn components, they will automatically inherit the Wise theme through the CSS variables. Run:

```bash
bunx shadcn@latest add <component-name>
```

The component will use the semantic tokens (`bg-primary`, `text-foreground`, `rounded-lg`, etc.) which are already mapped to Wise's palette.

---

## Future Additions

- [ ] **Dark mode** -- Add `.dark {}` block to `styles.css` with inverted Wise palette
- [ ] **Wise Sans font** -- Self-host when license is acquired, update `--font-display`
- [ ] **Motion system** -- Implement Wise's transition/animation tokens
- [ ] **Mobile radius scale** -- Add responsive radius adjustments (10/16/24/32/48px)
