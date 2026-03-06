# 🗺️ Roadmap Implementasi: Integrasi GEMINI AI ke POS App

> Dokumen ini berisi langkah-langkah lengkap untuk mengintegrasikan GEMINI AI sebagai asisten cerdas di aplikasi POS Anda — mulai dari setup awal hingga siap production.

---

## 📋 Overview Arsitektur

```
Frontend (POS App)
      │
      ▼
Backend Server (Node.js/Express)
      ├── GET  /api/chat/sessions       → list sesi
      ├── POST /api/chat/start          → buat sesi baru
      ├── POST /api/ask                 → kirim pertanyaan
      └── GET  /api/chat/:id/history    → ambil history
      │
      ├── Database (POSTGRESQL)
      │     ├── chat_sessions
      │     ├── chat_messages
      │     └── chat_pos_snapshots
      │
      └── GEMINI API (Google)
```

---

## ✅ Phase 1 — Setup & Persiapan

### 1.1 Daftar Google API Key
- Buka [console.cloud.google.com](https://console.cloud.google.com)
- Buat akun dan generate API Key
- Simpan API Key di file `.env` (jangan di-commit ke Git)

```env
GEMINI_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

### 1.2 Install Dependencies Backend

```bash
npm install @google/gemini-ai
```

### 1.3 Struktur Folder Project

```
pos-backend/
├── src/
│   ├── routes/
│   │   └── chat.js          ← endpoint chat
│   ├── services/
│   │   ├── geminiService.js        ← logic Gemini API
│   │   ├── posService.js           ← query data POS
│   │ 
│   └── app.js               ← entry point
├── migrations/
│   └── 001_create_chat_tables.sql
├── .env
└── package.json
```

---

## ✅ Phase 2 — Database Migration


### 2.3 Relasi Tabel

```
users
  └── chat_sessions (user_id → users.id)
        ├── chat_messages (session_id → chat_sessions.id)
        └── chat_pos_snapshots (session_id → chat_sessions.id)
```

---

## ✅ Phase 3 — Backend Development

### 3.1 Gunakan function yang ada di POS Data Service

Fungsi yang perlu digunakan:
- `getTodayRevenue()` — total transaksi & revenue hari ini
- `getTopItems()` — produk terlaris
- `getInventoryStatus()` — stok yang hampir habis
- `getStaffPerformance()` — performa kasir
- `getPOSContext()` — gabungkan semua data di atas

```js
// Contoh struktur return
{
  revenue: { today: 4875000, week: 31200000 },
  transactions: { total: 38, avg_order: 128289 },
  top_items: [...],
  inventory: [...],
  staff: [...],
  generated_at: "2026-03-04T10:00:00Z"
}
```


File: `src/services/cache.js`

| Data | TTL |
|------|-----|
| Revenue & transaksi | 2 menit |
| Top items | 5 menit |
| Stok inventory | 1 menit |
| Data mingguan/bulanan | 30 menit |

```js
const cache = new Map();

async function getCached(key, ttlMs, fetchFn) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data;
  const data = await fetchFn();
  cache.set(key, { data, ts: Date.now() });
  return data;
}
```

> 💡 Untuk production dengan banyak user, ganti Map dengan **Redis**.

### 3.3 Buat Gemini Service

File: `src/services/geminiService.js`

Fungsi yang perlu dibuat:
- `buildSystemPrompt(posData)` — buat system prompt dengan data POS
- `askGemini(question, history, posData)` — call Gemini API
- Batasi history maksimal **10 pesan terakhir** sebelum dikirim ke Gemini

### 3.4 Buat Chat Routes

File: `src/routes/chat.js`

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `POST` | `/api/chat/start` | Buat session baru, return `session_id` |
| `POST` | `/api/ask` | Kirim pertanyaan, simpan Q&A ke DB |
| `GET` | `/api/chat/:id/history` | Ambil history satu sesi |
| `GET` | `/api/chat/sessions` | List semua sesi user |

---

## ✅ Phase 4 — Frontend Integration

### 4.1 Komponen yang Perlu Dibuat

- `ChatButton` — tombol floating untuk buka chat
- `ChatWindow` — jendela chat utama
- `MessageBubble` — tampilan pesan user & Claude
- `SuggestionChips` — pertanyaan cepat (shortcut)

### 4.2 Flow Frontend

```
1. User login → ambil user_id dari auth
2. Buka chat  → POST /api/chat/start → simpan session_id di state
3. Kirim pesan → POST /api/ask { session_id, question }
4. Tampilkan jawaban Gemini
5. Ulangi langkah 3-4 (session_id tetap sama selama satu sesi)
```

### 4.3 Contoh API Call dari Frontend

```js
// Mulai sesi baru
const { session_id } = await fetch("/api/chat/start", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// Kirim pertanyaan
const { answer } = await fetch("/api/ask", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ session_id, question: "Berapa revenue hari ini?" })
}).then(r => r.json());
```

---

## ✅ Phase 5 — Testing

### 5.1 Test Manual (Urutan)

- [ ] Jalankan migration → cek tabel terbuat
- [ ] `POST /api/chat/start` → dapat `session_id`
- [ ] `POST /api/ask` dengan question sederhana → dapat jawaban
- [ ] Tanya 2–3 kali dalam sesi yang sama → Claude ingat konteks
- [ ] Cek tabel `chat_messages` → data tersimpan dengan benar

### 5.2 Skenario Test Percakapan

```
User: "Berapa revenue hari ini?"
Gemini: "Revenue hari ini Rp 4.875.000 dari 38 transaksi."

User: "Dibanding kemarin gimana?"   ← Gemini harus ingat konteks "hari ini"
Gemini: "Hari ini lebih tinggi X% dibanding kemarin..."

User: "Stok apa yang hampir habis?"
Gemini: "Ada 3 item dengan stok rendah: Beras 5kg, Minyak Goreng, Cabai Merah."
```

### 5.3 Test Edge Cases

- [ ] Pertanyaan di luar topik bisnis → Gemini harus tolak dengan sopan
- [ ] Sesi sangat panjang (50+ pesan) → pastikan hanya 10 terakhir yang dikirim
- [ ] Gemini API timeout → tampilkan pesan error yang ramah ke user

---

## ✅ Phase 6 — Production Checklist

### Security
- [ ] API Key Anthropic **tidak pernah** ada di frontend atau Git
- [ ] Semua endpoint chat wajib pakai **autentikasi** (JWT / session)
- [ ] Validasi `session_id` — user hanya boleh akses sesi miliknya sendiri
- [ ] Rate limiting: maksimal 20–30 request/menit per user

### Performance
- [ ] Caching aktif untuk data POS
- [ ] Index DB sudah ada di kolom `session_id` dan `user_id`
- [ ] Batasi history 10 pesan sebelum dikirim ke Gemini

### Monitoring
- [ ] Log setiap request ke Gemini (question + token usage)
- [ ] Alert jika token usage melebihi budget harian
- [ ] Monitor response time Gemini (target < 3 detik)

### Opsional tapi Direkomendasikan
- [ ] Ganti in-memory cache dengan **Redis**
- [ ] Gunakan **streaming** (`/api/ask/stream`) untuk UX lebih baik
- [ ] Tambah tombol **"Sesi Baru"** di frontend
- [ ] Simpan `snapshot` data POS di `chat_pos_snapshots` untuk audit

---

## 🧩 Ringkasan Phase

| Phase | Estimasi | Status |
|-------|----------|--------|
| 1 — Setup & Persiapan | 1 hari | ⬜ |
| 2 — Database Migration | 0.5 hari | ⬜ |
| 3 — Backend Development | 3–4 hari | ⬜ |
| 4 — Frontend Integration | 2–3 hari | ⬜ |
| 5 — Testing | 1–2 hari | ⬜ |
| 6 — Production Checklist | 1 hari | ⬜ |
| **Total** | **~9–12 hari kerja** | |

---

*Dokumen ini dibuat sebagai panduan implementasi. Sesuaikan dengan stack teknologi dan kebutuhan bisnis Anda.*