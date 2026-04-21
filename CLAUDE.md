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
