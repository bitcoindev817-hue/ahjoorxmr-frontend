# Ahjoor Frontend

**Ahjoor** is a trustless community savings (ajo/esusu-style) platform built with transparency in mind. This repository contains the frontend application: a Next.js / React dashboard where savings circle organizers and participants manage circles, track contributions, and monitor payouts.

---

## Screenshots

> Real screenshots still need to be captured from a running instance (this environment has no browser rendering available to produce them). The paths below are placeholders — drop the corresponding PNGs into `docs/screenshots/` to make them live.

| Landing page | Dashboard | Circle detail |
| --- | --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Circle detail](docs/screenshots/circle-detail.png) |

---

## Features

* **Dashboard** — customizable, drag-and-drop widget layout (stats overview, balance breakdown, savings growth chart, active savings, upcoming payouts calendar, annual savings summary, savings goals, recent achievement).
* **Circles** — discover, create, join, duplicate and compare savings circles; grid/list views, bookmarking, tags, search/autocomplete, categories and an archive view.
* **Circle detail** — per-circle activity feed, discussion threads with moderation, member management, join requests, seat transfers, invite links, pause/resume, and circle rules/agreements.
* **Contributions** — contribution history and status (on-time / late / missed) per circle.
* **Payouts** — payout history, per-payout receipts, and a payout draw view.
* **Wallet** — balance breakdown, send/receive transfers, locked funds, low-balance alerts, and a gas fee estimator.
* **Goals** — savings goals tracking.
* **Achievements & leaderboard** — badges/achievements, milestone celebrations, and a participant leaderboard.
* **Referrals** — referral program views.
* **Statements** — downloadable/exportable account statements and annual summaries.
* **Notifications** — in-app notification center with categories, do-not-disturb quiet hours, and alert preferences.
* **Profile** — participant profile pages, contact directory, and address book.
* **Settings** — theme (light/dark), table density, high-contrast mode, email notification preferences, and account data export.
* **Security** — two-factor authentication (TOTP) and passkey support, email verification.
* **Support** — support ticket views and a help center.
* **Other** — a savings calculator, changelog, cookie consent, offline fallback page, and onboarding feature spotlights.

---

## Tech stack

* [Next.js](https://nextjs.org/) 16 (App Router) + [React](https://react.dev/) 19, written in TypeScript.
* [Tailwind CSS](https://tailwindcss.com/) 4 for styling.
* [TanStack Query](https://tanstack.com/query) for server-state data fetching/caching (see `lib/api` and `lib/hooks`).
* A typed API client layer (`lib/api`) that serves mock data locally and switches to a real HTTP backend via `NEXT_PUBLIC_API_URL` — see [Environment variables](#environment-variables).

---

## Getting started

### Prerequisites

* Node.js 20+
* [pnpm](https://pnpm.io/) (the repo is pnpm-managed — `pnpm-lock.yaml` / `pnpm-workspace.yaml`)

### Installation

```bash
git clone https://github.com/ussyalfaks/ahjoorxmr-frontend.git
cd ahjoorxmr-frontend

# Install dependencies
pnpm install

# Copy the example env file and adjust as needed (all vars are optional for local dev)
cp .env.example .env.local

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Starts the Next.js development server with hot reload. |
| `pnpm build` | Builds the app for production. |
| `pnpm start` | Runs the production build (run `pnpm build` first). |
| `pnpm lint` | Runs ESLint across the codebase. |

---

## Environment variables

All of the following are `NEXT_PUBLIC_*` variables, which Next.js inlines into both the server and client bundles at build time. None are required for local development — the app runs entirely on bundled mock data when they're unset. See `.env.example` for a ready-to-copy template.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | When the HTTP adapter is used | _unset_ (mock adapter) | Base URL of the backend API. When set, the typed API client (`lib/api`) uses the HTTP adapter and calls `${NEXT_PUBLIC_API_URL}/circles`, `/contributions`, `/payouts`, `/notifications`, etc. When unset, it falls back to the mock adapter serving `data/*.ts` with simulated latency. Must be an absolute http(s) URL. |
| `NEXT_PUBLIC_API_ADAPTER` | No | inferred from `NEXT_PUBLIC_API_URL` | Which API implementation serves the data: `"mock"` or `"http"`. Leave unset and the app picks `"http"` when `NEXT_PUBLIC_API_URL` is set, `"mock"` otherwise. `"http"` requires `NEXT_PUBLIC_API_URL` to be set. |
| `NEXT_PUBLIC_HEARTBEAT_URL` | No | `/` | Endpoint periodically pinged to detect connectivity loss/reconnects (`lib/connection.ts`). |
| `NEXT_PUBLIC_STELLAR_NETWORK` | No | `testnet` | The Stellar network the app operates on: `testnet`, `mainnet`, `standalone` or `futurenet` (`config/network.ts`). |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | No | passphrase of the selected network | Network passphrase compared against a connected wallet's network (`components/wallet/NetworkGuard.tsx`). |
| `NEXT_PUBLIC_STELLAR_NETWORK_LABEL` | No | label of the selected network | Human-readable network name shown in the network-mismatch guard. |
| `NEXT_PUBLIC_STARKNET_RPC_URL` | No | _unset_ (static estimate) | Starknet RPC endpoint used to estimate on-chain gas fees (`lib/gasFee.ts`). Must be an absolute http(s) URL. |
| `NEXT_PUBLIC_OFFRAMP_ENABLED` | No | `true` | Set to `"false"` to hide the bank-transfer off-ramp payout method (`lib/payoutMethods.ts`). |
| `NEXT_PUBLIC_OFFRAMP_PARTNER` | No | `Bank transfer partner` | Display name for the off-ramp partner shown in payout method UI. |

### Validation

Every variable above is declared in `lib/env.ts` and validated with zod when the module is first loaded. The values are checked for type, for allowed values, and against each other, so a configuration that cannot work is reported instead of silently misbehaving:

```text
Invalid environment configuration:
  • NEXT_PUBLIC_API_URL is required when NEXT_PUBLIC_API_ADAPTER is "http"
  • NEXT_PUBLIC_STARKNET_RPC_URL: must be an absolute http(s) URL

Copy .env.example to .env.local and fill in the missing values.
```

The app fails to build (or to start) with that message rather than running with `undefined` values. Application code never reads `process.env` directly — it imports `env` (public values) or `serverEnv` (server-only values) from `lib/env.ts` instead, which keeps the set of supported variables in one place.

---

## Contributing

We welcome contributors of all experience levels!

### Getting started

* Look for **good first issues**
* Fork the repository
* Create a feature branch
* Open a pull request
* [Figma Design](https://www.figma.com/design/NlDFuleGHbh26rRp1ZfyvE/Ahjoor-Design?node-id=0-1&t=3E08H8am5RpUngRF-1)

### Branching strategy

### Branching Strategy

### Code guidelines

### Commit Convention

### Commit convention

We use **Conventional Commits** to standardize commit messages.

---

---

## Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Stellar CLI Reference](https://developers.stellar.org/docs/tools/developer-tools)

---

## License

This project is licensed under the **MIT License**.

---

## Contact us

Have questions or feedback?

* [Telegram: Ahjoor Telegram Group](https://t.me/ahjoor)
