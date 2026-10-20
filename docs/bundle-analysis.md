# Bundle analysis

How to look at what actually ships to the browser, and the numbers this repository
is holding itself to.

## Running the analyzer

The repo uses Next.js 16, whose default bundler is Turbopack. `@next/bundle-analyzer`
is a webpack plugin, so it needs a webpack build:

```bash
pnpm analyze
```

That runs `ANALYZE=true next build --webpack` and writes three reports to
`.next/analyze/`:

| File | Contents |
| --- | --- |
| `client.html` | The browser bundle — what a visitor downloads. |
| `nodejs.html` | The Node.js server runtime. |
| `edge.html` | The edge runtime. |

Open `.next/analyze/client.html` in a browser to get the treemap. The
`ANALYZE` flag is read through `lib/env.ts` (`serverEnv.ANALYZE`), so a normal
`pnpm build` is completely unaffected — no report is produced and no
analyzer code is bundled.

Next.js 16 also ships a native Turbopack analyzer, which works on an ordinary
Turbopack build:

```bash
pnpm build
pnpm analyze:turbopack
```

`next analyze` does not produce a build of its own, so the build has to exist
first. It serves an interactive UI on port 4000; pass `--output` to write the
analysis to disk instead.

## Baseline

Measured on the commit that introduced this document, with
`ANALYZE=true next build --webpack` and the `client.html` report.
"Parsed" is the size of the chunk after minification; "gzip" is the
compressed transfer size.

### Main routes

| Route | Parsed | gzip |
| --- | ---: | ---: |
| `/` | 24.8 kB | 6.5 kB |
| `/help` | 27.9 kB | 9.0 kB |
| `/login` | 2.3 kB | 0.9 kB |
| `/forgot-password` | 13.8 kB | 4.2 kB |
| `/dashboard` | 53.2 kB | 13.8 kB |
| `/dashboard/layout` (shared by every dashboard route) | 33.0 kB | 8.9 kB |
| `/dashboard/circles` | 88.8 kB | 22.4 kB |
| `/dashboard/circles/[id]` | 86.3 kB | 22.9 kB |
| `/dashboard/circles/[id]/settings` | 55.2 kB | 13.7 kB |
| `/dashboard/circles/[id]/analytics` | 9.1 kB | 2.7 kB |
| `/dashboard/contributions` | 22.1 kB | 6.6 kB |
| `/dashboard/payouts` | 14.5 kB | 4.6 kB |
| `/dashboard/statements` | 17.9 kB | 5.6 kB |
| `/dashboard/wallet` | 42.6 kB | 11.3 kB |
| `/dashboard/settings` | 85.9 kB | 21.6 kB |
| `/dashboard/notifications` | 18.7 kB | 5.9 kB |
| `/dashboard/achievements` | 26.2 kB | 6.9 kB |
| `/dashboard/goals` | 14.8 kB | 4.7 kB |
| `/dashboard/leaderboard` | 12.1 kB | 4.0 kB |
| `/dashboard/referrals` | 8.8 kB | 2.8 kB |
| `/dashboard/locked-funds` | 5.7 kB | 2.3 kB |

### Shared base

Every route also loads the framework and runtime chunks:

| Chunk | Parsed | gzip |
| --- | ---: | ---: |
| `framework` | 185.2 kB | 58.3 kB |
| `main` | 134.5 kB | 40.0 kB |
| `webpack` runtime | 3.4 kB | 1.7 kB |
| **Total** | **323.1 kB** | **100.0 kB** |

The framework and main chunks are Next.js and React itself; they are not
something this app can shrink. Application code is the part worth watching,
and that is what the per-route table above measures.

The largest shared non-framework chunks are the React and Next.js runtimes
themselves (`6254-*.js` at 237.5 kB parsed and `5e9b781c-*.js` at 199.0 kB
parsed are the React server-dom and client runtimes). No single
application-owned shared chunk is larger than the route chunks listed above.

## What is loaded on demand

Heavy or rarely-used code is pulled out of the initial bundle with
`next/dynamic` or a dynamic `import()`:

| Module | Loaded by | Trigger |
| --- | --- | --- |
| `components/charts/SavingsGrowthChart` | `next/dynamic` in `app/dashboard/page.tsx` | When the dashboard renders the "chart" panel |
| `components/charts/ContributionFiatValueChart` | `next/dynamic` in `app/dashboard/circles/[id]/analytics/page.tsx` | When the analytics page renders its charts |
| `lib/exportPdf` | `import("@/lib/exportPdf")` | When a PDF export is requested |
| `qrcode` (via `lib/twoFactor.ts`) | `import("qrcode")` | While setting up two-factor authentication |

The PDF export deliberately uses the browser's own print-to-PDF through a
sandboxed iframe rather than a PDF library, so there is no PDF dependency to
ship in the first place. Splitting the module out means even the printable
document markup and the iframe handling stay out of the bundle until someone
asks for a PDF.

### Effect of the change

Moving the charts, the PDF export and the QR encoder out of the initial
bundle:

| Route | Before | After | Change |
| --- | ---: | ---: | ---: |
| `/dashboard` | 58.6 kB | 53.2 kB | −5.4 kB (−9.2%) |
| `/dashboard/circles/[id]/analytics` | 17.1 kB | 9.1 kB | −8.1 kB (−47.4%) |
| `/dashboard/statements` | 19.7 kB | 17.9 kB | −1.8 kB (−9.1%) |
| `/dashboard/contributions` | 23.9 kB | 22.1 kB | −1.8 kB (−7.5%) |

"Before" is the same build with the lazy loading reverted.

## Keeping the numbers honest

- Re-run `pnpm analyze` after a change that adds a dependency or a heavy
  component, and update the tables above if a route moves.
- A new `import` of a chart, the PDF exporter or the QR encoder inside a
  component that is on the critical path will pull that code back into the
  initial bundle. Check the report afterwards.
- The per-route table is the number that matters for a visitor; the total
  across all chunks is not, because most routes are never visited together.
