# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # Run ESLint (v9 flat config)
```

There is no test runner configured.

## Stack

- **Next.js 16** (App Router) + **React 19** — read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ significantly from older versions
- **TypeScript** strict mode; path alias `@/*` → `src/*`
- **Tailwind v4** via `@tailwindcss/postcss` — configuration is CSS-first (no `tailwind.config.*`); all tokens are defined as CSS custom properties in `src/app/globals.css`
- **shadcn/ui** (`components.json`) with Radix UI primitives; add components via `npx shadcn add <component>`
- **CVA** (`class-variance-authority`) for component variant definitions

## Architecture

### Design tokens

All design tokens (colors in OKLch, spacing, radius, shadows, fonts, chart colors, sidebar variants) live in `src/app/globals.css` under `@layer base` and `@theme inline`. Dark mode is defined there too. Do not add a separate Tailwind config file — v4 reads tokens from CSS.

### Component pattern

UI primitives go in `src/components/ui/`. Each component:

- Uses CVA to define `variants` and `defaultVariants`
- Exposes `data-slot`, `data-variant`, `data-size` attributes for external CSS targeting
- Supports `asChild` via Radix `Slot.Root` when polymorphic rendering is needed
- Uses `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for class composition

### Fonts

Three font variables are set on `<html>` in `layout.tsx`: `--font-sans` (Inter), `--font-serif` (Geist), `--font-mono` (Geist Mono). They map to `font-sans`, `font-serif`, `font-mono` Tailwind utilities via the `@theme inline` block in `globals.css`.

## Color & Styling Rules

**Never use hardcoded colors.** No hex codes, no `rgb()`, no inline `oklch()` literals, no Tailwind palette utilities like `emerald-*`, `amber-*`, `red-*`, `blue-*`, `green-*`, `gray-*`, etc. Do not add new CSS variables — use only what is defined in `src/app/globals.css`.

**Always use CSS custom properties** from `src/app/globals.css`:

| Intent | Variable / Utility |
| --- | --- |
| Primary brand / positive | `var(--primary)` / `text-primary` / `bg-primary` |
| Error / danger | `var(--destructive)` / `text-destructive` / `bg-destructive` |
| Chart segment 1 (lightest) | `var(--chart-1)` / `text-chart-1` |
| Chart segment 2 | `var(--chart-2)` / `text-chart-2` |
| Chart segment 3 | `var(--chart-3)` / `text-chart-3` |
| Chart segment 4 | `var(--chart-4)` / `text-chart-4` |
| Chart segment 5 (darkest) | `var(--chart-5)` / `text-chart-5` |
| Muted tones | `var(--muted)` / `var(--muted-foreground)` |
| Borders | `var(--border)` / `border-border` |
| Card backgrounds | `var(--card)` / `bg-card` |

**Charts:** Use `recharts` with `ResponsiveContainer`. Pass CSS variables as strings to color props (e.g. `stroke="var(--chart-1)"`). Use `linearGradient` with `stopColor="var(--chart-1)"` for area fills. Never pass hex/rgb literals to chart components. Do not use the deprecated `Cell` component — put `fill` directly on each data item.

**Conditional colors in JSX:** Use `cn()` with token-based Tailwind utilities (e.g. `cn(ok ? "text-primary" : "text-destructive")`), or inline `style={{ color: "var(--primary)" }}` — never Tailwind palette classes.
