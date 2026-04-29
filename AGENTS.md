<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:color-rules -->
## Color & Styling — Non-Negotiable Rules

**Never hardcode colors.** No hex (`#3b82f6`), no `rgb()`, no inline `oklch()` literals, no Tailwind palette utilities (`emerald-*`, `amber-*`, `red-*`, `blue-*`, `green-*`, `gray-*`, `zinc-*`, etc.). **Do not add new CSS variables** — use only what is already defined in `src/app/globals.css`.

All colors come from CSS custom properties defined in `src/app/globals.css`.

| Intent | CSS variable | Tailwind utility |
| --- | --- | --- |
| Primary brand / positive | `--primary` | `text-primary` / `bg-primary` |
| Error / danger | `--destructive` | `text-destructive` / `bg-destructive` |
| Chart segment 1 (lightest) | `--chart-1` | `text-chart-1` / `bg-chart-1` |
| Chart segment 2 | `--chart-2` | `text-chart-2` / `bg-chart-2` |
| Chart segment 3 | `--chart-3` | `text-chart-3` / `bg-chart-3` |
| Chart segment 4 | `--chart-4` | `text-chart-4` / `bg-chart-4` |
| Chart segment 5 (darkest) | `--chart-5` | `text-chart-5` / `bg-chart-5` |
| Muted | `--muted` / `--muted-foreground` | `text-muted-foreground` |
| Borders | `--border` | `border-border` |
| Cards | `--card` | `bg-card` |

**Charts:** Always use `recharts` + `ResponsiveContainer`. Pass CSS variables as strings to color props (`stroke="var(--chart-1)"`). Use `<linearGradient stopColor="var(--chart-1)" />` for gradient fills. Never pass raw color values to chart components. Do not use the deprecated `Cell` component — put `fill` directly on each data item instead.
<!-- END:color-rules -->
