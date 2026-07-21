# Provider Dashboard

**Next.js 14 + React + TypeScript + Tailwind CSS** portal for service providers.

## Purpose
Self-service portal where registered providers manage their business profile, service listings, bookings, and view earnings.

## Access
Restricted to `PROVIDER` role.

## Pages (Planned)
```
app/
├── (auth)/
│   └── login/            # Provider login
├── (dashboard)/
│   ├── page.tsx          # Business overview
│   ├── services/         # Service listing management
│   ├── bookings/         # Booking calendar and management
│   ├── earnings/         # Revenue and payout reports
│   ├── reviews/          # Customer reviews
│   ├── profile/          # Business profile
│   └── settings/         # Account settings
└── layout.tsx
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Key Dependencies
Same as admin-dashboard. See [../admin-dashboard/README.md](../admin-dashboard/README.md).

---
*Implementation: Phase 3 (bookings) onwards*
