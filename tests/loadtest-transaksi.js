import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi tipe uji beban (Load Test)
// Kita turunkan sedikit targetnya karena endpoint transaksi lebih berat (melibatkan Database & Kalkulasi)
export const options = {
  insecureSkipTlsVerify: true, 
  stages: [
    { duration: '10s', target: 20 },  // Fase 1: Naikkan hingga 20 kasir bersaman
    { duration: '30s', target: 20 },  // Fase 2: Pertahankan 20 kasir menembak API
    { duration: '10s', target: 0 },   // Fase 3: Ramp down ke 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],    // Kegagalan < 5%
    http_req_duration: ['p(95)<2000'], // 95% requests selesai di bawah 2 detik (karena ini operasi insert DB)
  },
};

// ==========================================
// ⚠️ PERHATIAN: ISI DATA DI BAWAH INI DAHULU
// ==========================================
const ACCESS_TOKEN = 'PASTE_TOKEN_JWT_ANDA_DI_SINI'; // Ambil dari Inspect Element -> Network (Authorization Bearer) saat login
const ID_CABANG = 'PASTE_ID_CABANG_YANG_VALID_DI_SINI';
const ID_PRODUK = 'PASTE_ID_PRODUK_YANG_VALID_DI_SINI';
// ==========================================

export default function () {
  const url = 'https://casir-nginx/api/transaksi';
  
  const payload = JSON.stringify({
    cabang_id: ID_CABANG,
    jenis_transaksi: "PENJUALAN",
    metode_pembayaran: "TUNAI",
    biaya_tambahan: 0,
    details: [
      {
        produk_id: ID_PRODUK,
        jumlah: 1,
        harga_satuan: 15000, 
        diskon_persen: 0,
        pajak_persen: 0
      }
    ]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`, 
    },
  };

  // Lakukan POST request
  const res = http.post(url, payload, params);
  
  // Validasi respons
  check(res, {
    'status HTTP adalah 201 (Created)': (r) => r.status === 201,
    'waktu respons di bawah 2000ms': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
}
