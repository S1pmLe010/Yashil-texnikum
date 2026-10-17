# Yashil Texnikum Portal

Next.js 14 (App Router) + MongoDB (Mongoose) + Tailwind. Rollar: **ustoz** va **o'quvchi**.

## Ishga tushirish

```bash
npm install
cp .env.example .env     # qiymatlarni to'ldiring
npm run dev              # http://localhost:3000
```

`.env`:

| O'zgaruvchi | Vazifasi |
|---|---|
| `MONGODB_URI` | MongoDB manzili (lokal yoki Atlas) |
| `JWT_SECRET` | Sessiya imzosi, uzun tasodifiy qator |
| `TEACHER_CODE` | Ustoz sifatida ro'yxatdan o'tish kodi (o'quvchilarga bermang) |
| `ANTHROPIC_API_KEY` | AI Repetitor uchun Claude API kaliti |
| `ANTHROPIC_MODEL` | Ixtiyoriy, standart `claude-sonnet-5-5` |

Birinchi foydalanish: `/register` → "Ustoz" → `TEACHER_CODE` ni kiriting. Keyin ustoz **Fan qo'shish → Dars qo'shish → Vazifa qo'shish** qiladi. O'quvchilar guruh nomi (masalan `26 IT 4`) bilan ro'yxatdan o'tadi va faqat o'z guruhi ma'lumotlarini ko'radi.

## Rollar bo'yicha imkoniyatlar

- **O'quvchi:** dars jadvali, materiallarni yuklab olish, vazifa topshirish (fayl + izoh), baholar, imtihonlar, AI Repetitor, guruh chati va e'lonlar, profil.
- **Ustoz:** hammasini ko'radi (guruhni almashtirib), fan/dars/material/vazifa/imtihon/e'lon yaratadi va o'chiradi, topshirilgan ishlarni baholaydi, qo'shimcha baho qo'yadi, talabalar ro'yxati.

## Muhim eslatmalar

- **Fayllar** `uploads/` papkasida saqlanadi → doimiy diskli serverda (VPS/Docker volume) ishlaydi. Vercel kabi serverless'da S3/R2 ga o'tkazish kerak (`app/api/upload`, `app/api/files`).
- **Real-time chat (SSE)** bitta Node jarayonida ishlaydi (`next start`). Bir nechta nusxa/serverless bo'lsa Redis pub/sub kerak (`lib/events.js`).
- HTTP (HTTPS'siz) serverda productionda cookie o'rnatilishi uchun `.env` ga `INSECURE_COOKIES=1` qo'shing; HTTPS bo'lsa kerak emas.
- Baho shkalasi: 86–100% → 5, 71–85% → 4, 55–70% → 3, pastida 2 (`lib/format.js`).
# Yashil-texnikum
