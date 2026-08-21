# Battery Swap Monitoring Dashboard - ECGO

Internal ops dashboard untuk memantau 50 cabinet battery swap.

**Live Demo:** https://ecgo-battery-dashboard-ecgo.vercel.app
**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + PostgreSQL (Neon)

## Cara Setup

1. Clone & Install
```bash
git clone <repo-url>
cd battery-swap-dashboard
npm install
```

2. Environment Variable
Buat file `.env.local`:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
```

3. Seed Data (50 cabinets, 600 slots, 20.000+ transactions 30 hari)
```bash
npm run seed
```
Idempotent - truncate & re-insert realistis.

4. Run Dev
```bash
npm run dev
# http://localhost:3000
```

5. Deploy
```bash
vercel --prod
```

## Fitur Wajib - Sudah Selesai 100%

**Halaman 1 - Daftar Cabinet**
- [x] Tabel: kode cabinet, cabang, status, slot terisi/total, swap 24h, last heartbeat
- [x] Pencarian server-side `?q=` via `ILIKE` di SQL, bukan filter client
- [x] Filter status: ONLINE, OFFLINE, MAINTENANCE
- [x] Sorting: Swap Terbanyak/Tersedikit, Kode, Heartbeat (ORDER BY di DB)
- [x] Pagination offset `?page=&limit=` + meta total, totalPages, hasNext/Prev
- [x] State pencarian & filter tersimpan di URL (useSearchParams) - bisa share & refresh

**Halaman 2 - Detail Cabinet**
- [x] Grid 12 slot warna per state (EMPTY, CHARGING, FULL, LOCKED, FAULT) + SOC %
- [x] Grafik swap per jam 24 jam terakhir via `date_trunc('hour', created_at)` agregasi di DB
- [x] Daftar 20 transaksi swap terakhir

**Wajib Ada**
- [x] API: `GET /api/cabinets` & `GET /api/cabinets/[id]` & `PATCH /api/cabinets/[id]` + validasi Zod
- [x] Response error konsisten `{success:false, error, details}`
- [x] Tidak ada N+1 - semua count pakai subquery `(SELECT COUNT(*)...)`, agregasi di DB bukan reduce JS
- [x] UI State: Loading skeleton, Empty no result, Error retry

## Asumsi & Keputusan Spesifikasi

Bagian ini paling penting karena spesifikasi sengaja tidak lengkap:

1. **Definisi Swap 24 Jam Terakhir:** Saya pakai **rolling window 24 jam** `created_at > NOW() - INTERVAL '24 hours'` bukan since midnight 00:00. Alasan: Tim operasional butuh pantauan real-time rolling, jika since midnight angka akan drop drastis tiap jam 00:00 dan menyesatkan.

2. **Cabinet OFFLINE apakah slot tetap ditampilkan?** Ya, tetap tampilkan state slot terakhir yang diketahui dari DB. Status OFFLINE hanya badge merah di header. Alasan: Data terakhir tetap berguna untuk diagnosa. Stale ditandai dari `last_heartbeat` > 10 menit. Alternatif hide slot akan menghilangkan konteks.

3. **Bagaimana kalau last_heartbeat kosong/null?** UI tampilkan `-` dan treat sebagai OFFLINE di filter. Di sorting `heartbeat_desc`, NULL di taruh paling bawah dengan `NULLS LAST`.

4. **Pagination Offset vs Cursor:** Saya pilih **Offset Pagination** (`LIMIT/OFFSET`). Alasan: Data hanya 50 cabinet (kecil), user butuh info total pages & bisa jump to page. Cursor lebih efisien untuk 10k+ data karena tidak perlu COUNT total, tapi trade-off tidak bisa jump page. Untuk 50 data, cost COUNT(*) negligible.

5. **Search:** Pakai `ILIKE '%q%'` sederhana. Trade-off: tidak tahan typo & tidak ada ranking. Jika scale ke 10.000 cabang, akan migrasi ke `pg_trgm` extension atau MeiliSearch.

## Trade-off Lain

- Tidak pakai ORM (Prisma/Drizzle) - pakai raw SQL `neon`/`@neondatabase/serverless` agar kontrol agregasi jelas dan mudah audit N+1.
- Grafik pakai bar sederhana Tailwind, bukan Recharts - untuk menjaga bundle size kecil (<100kb).
- Belum pakai caching Redis - `fetch` Next.js dengan `revalidate: 30` sudah cukup untuk internal dashboard.

## Apa Yang Belum Selesai (Bonus)

Semua wajib sudah selesai. Bonus yang belum:

- **Realtime:** Saat ini auto-refresh 30 detik. Rencana: Supabase Realtime / Pusher channel `cabinet:update` + `transaction:new`.
- **Optimistic UI:** API PATCH sudah support, tapi UI belum optimistic - masih tunggu response baru update badge.
- **Test:** Belum ada unit/E2E test. Rencana: Vitest untuk validator Zod & Playwright untuk flow search->detail.
- **Dark Mode:** Belum.

Sesuai instruksi: Bonus tidak dikerjakan dengan mengorbankan yang wajib.

## AI Tools Yang Dipakai

Dicantumkan:

1. **Meta AI:** Debugging error `405 Method Not Allowed` saat PATCH cabinet, generate handler `PATCH/PUT` dengan validasi Zod, dan drafting README ini.
2. **v0 by Vercel:** Generate initial UI table & grid slot 12 kolom + styling status badge.
3. **ChatGPT:** Bantu generate script seed data distribusi transaksi realistis selama 30 hari (peak hour siang & sore).

Semua query SQL agregasi, keputusan arsitektur, dan logic URL state ditulis & direview manual.

## Git History

Commit bertahap bermakna (bukan 1x initial commit besar):

- `feat: init nextjs 15 + neon db + tailwind`
- `feat: cabinets list with server-side search, filter, sort, pagination`
- `feat: cabinet detail with 12 slots grid and 24h chart`
- `feat: seed script 50 cabinets 600 slots 20k transactions`
- `fix: add PATCH handler for cabinet status update OFFLINE`
- `docs: complete README with assumptions & tradeoffs`

## Estimasi Waktu

Dikerjakan dalam ~2.5 jam (di bawah estimasi 3-5 jam). Prioritas kerapian & semua wajib jalan daripada menambah bonus berantakan.
