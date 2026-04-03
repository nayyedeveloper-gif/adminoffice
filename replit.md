# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### Admin Office Chairman Dashboard (`/`)
- **Path**: `artifacts/admin-dashboard`
- **Type**: React + Vite
- **Purpose**: Admin Department Chairman overview dashboard with Google Sheets API integration
- **Data Source**: Google Sheets (ID: `1yzB5awmsJxE9Ug4mwl8Jl90VvOR2IgsEnepl0LJrc_8`)
- **Sheets**: Attendance, General Purchase, Canteen, Vehicle, Warehouse, Generator, CCTV, IT, M&E, Office
- **Features**:
  - KPI Cards: Total Staff, Present Today, Canteen Sales, Pending Purchases
  - Attendance tab: Bar chart + Pie chart + department table with rates
  - Canteen tab: Financial overview with Opening/Purchase/Sale/Closing breakdown
  - Purchase tab: General purchase tracker with completion progress bars
  - Department module cards (Vehicle, Warehouse, Generator, CCTV, IT, M&E)
- **Env vars**: `VITE_GOOGLE_SHEETS_API_KEY`, `VITE_SPREADSHEET_ID`
- **Secret**: `GOOGLE_SHEETS_API_KEY`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
