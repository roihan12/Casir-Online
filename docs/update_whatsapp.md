# Rencana Implementasi WhatsApp Multi-Device (Per Cabang)

Fitur ini bertujuan mengubah sistem WhatsApp yang sebelumnya berspesifikasi tunggal (single-device/singleton) menjadi multi-device yang terpartisi berdasarkan "Cabang".

## Validasi Alur Frontend (Tujuan Utama)
Alur yang Anda usulkan di frontend **sudah tepat, logis, dan rapi**. Secara flow:
1. **Show List Device**: Aplikasi memanggil API list bot config berdasarkan filter cabang (dari user session/context).
2. **Pilih & Connect**: Dari list tersebut, user dapat memilih salah satu bot. Jika dipilih, diteruskan ke halaman detail untuk melihat status, scan QR, dan mengatur webhook.
3. **Empty State / Create**: Jika list kosong (atau mau tambah device untuk cabang), disediakan tombol/form "Buat Device Baru". Tindakan ini mensubmit API untuk membuat `botconfig` lalu backend men-trigger inisialisasi session WhatsApp kosong (menunggu discan QR-nya).

Untuk mengkonkretkan alur ideal di atas, berikut adalah *Proposed Changes* secara keseluruhan.

> [!NOTE]
> **Struktur Menu & URL (React Router v7)**
> Untuk merealisasikan alur tersebut secara rapi, saya mengusulkan dua tingkatan halaman di frontend:
> 1. `URL: /whatsapp` -> Menampilkan UI Daftar Device/Bot untuk Cabang saat ini (List Page).
> 2. `URL: /whatsapp/:botId` -> Halaman konfigurasi spesifik bot, menampilkan status, koneksi, dan Scan QR (merupakan hasil refactor dari [BotConfigPage.jsx](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/client/src/features/whatsapp/pages/BotConfigPage.jsx) lama).
> Apakah Anda setuju dengan skema URL route ini?

## Proposed Changes

### Database Layer (Backend)
- Modifikasi skema/migrasi [BotConfig](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/client/src/features/whatsapp/services/whatsappService.js#10-23) dan Tabel/Model Sesi Device (jika ada) untuk memuat `cabang_id` (Foreign Key).

### Controller & Service Layer (Backend)
- Menerapkan **Service Layer Pattern** untuk CRUD bot config per cabang.
- Endpoint baru: `GET /api/botconfigs/cabang/:cabangId`.
- Update validasi saat pembuatan bot (wajib kirim `cabang_id`), dan langsung *spawn* WA Thread/Instance kosong pada service memory.
- Penyesuaian Endpoint get status & get QR agar spesifik mengambil dari session `botId` di memori, bukan secara *global singleton*.

### Frontend Application
*(Menerapkan Global Rules: Tailwind, Zod, React-Hook-Form, Axios, Tanstack Query v5)*

- **API & Hooks layer**:
  - Update [whatsappService.js](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/src/services/whatsappService.js) untuk memanggil API dengan metode `axios` disertai parameter terkait cabang.
  - Pembuatan hooks di `useWhatsapp.js` berlandaskan TanStack React Query v5. Termasuk cache freshness dengan *stale-while-revalidate*, form mutations (create/update bot) menggunakan pola *optimistic updates*, error boundaries, dan `queryClient.invalidateQueries`.
- **Pages & Components**:
  - Pembuatan komponen **`/whatsapp` (BotListPage)** dengan fitur UI warna desain premium (*colorful*), resonsif tailwind css, dan tombol menggunakan `react-icons`.
  - Modal form terintegrasi dengan `react-hook-form` & divalidasi dengan `Zod` (min karakter bot name, penanganan format phone number webhok URL, error message text merah, dst).
  - Refactoring **[BotConfigPage.jsx](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/client/src/features/whatsapp/pages/BotConfigPage.jsx)** menjadi halaman detail yang mengambil `botId` menggunakan React Router `useParams()`.


## Verification Plan

### Langkah Pengujian Detail (Automated/Manual Verifications)
1. **Isolasi Fetching per Cabang**: Login menggunakan User Cabang A, buat 1 [BotConfig](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/client/src/features/whatsapp/services/whatsappService.js#10-23). Verifikasi bahwa daftar bot di UI hanya muncul *single* konfigurasi itu. Login menggunakan User Cabang B, harus menampilkan status *empty list*.
2. **Koneksi Multi-Instance**: Siapkan 2 device/HP di dunia nyata. Untuk Cabang A, scan QR Code `Bot A`. Untuk Cabang B, scan QR Code `Bot B`. Kedua nomor HP harus status "online" secara bersamaan di server.
3. **Webhook & Balasan**: Mengirim pesan ke Nomor Bot A. Validasi server memberikan auto-reply sesuai setting [BotConfig](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/client/src/features/whatsapp/services/whatsappService.js#10-23) milik Cabang A tanpa membocorkan state atau konfigurasi [BotConfig](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/client/src/features/whatsapp/services/whatsappService.js#10-23) milik cabang lainnya.
