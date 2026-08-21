# 🔋 Battery Swap Monitoring Dashboard

Mini internal dashboard untuk tim operasional memantau cabinet battery swap. Dibuat untuk technical assignment ECGO.

**Live:** http://localhost:3001
**Stack:** Next.js 15 App Router, TypeScript, TailwindCSS, Neon PostgreSQL, Recharts, Zod

## ✨ Fitur Implementasi
- **Cabinet List** - Map & status ONLINE/OFFLINE
- **Cabinet Detail `/cabinet/[id]`** - 12 slot real-time
    - FULL = hijau (90-100%), CHARGING = kuning, LOCKED/FAULT = merah
- **Swap Chart 24h** - Recharts bar chart
- **20 Transaksi Terakhir** - Out/In battery & SoC

## 🚀 Cara Setup & Run
```bash
# 1. Clone & install
npm install

# 2. Env (Neon)
# Buat file .env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# 3. Init schema (sekali saja)
npx tsx lib/init.ts

# 4. Seed data realistis - 50 cabinet, 600 slot, 20.000 transaksi 30 hari
npm run seed

# 5. Run dev
npm run dev
# buka http://localhost:3001