import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi tipe uji beban (Load Test)
export const options = {
  insecureSkipTlsVerify: true, // Mengabaikan error validasi SSL karena kita menggunakan self-signed cert lokal
  stages: [
    { duration: '10s', target: 50 },  // Fase 1: Pemanasan - Naikkan hingga 50 pengguna virtual (VU) bersaman
    { duration: '30s', target: 50 },  // Fase 2: Bertahan - Pertahankan 50 VU menembak API selama 30 detik
    { duration: '10s', target: 0 },   // Fase 3: Pendinginan - Ramp down ke 0 pengguna
  ],
  thresholds: {
    // Kriteria keberhasilan (Thresholds)
    http_req_failed: ['rate<0.05'],    // Batas kegagalan tidak boleh lebih dari 5%
    http_req_duration: ['p(95)<1000'], // 95% jumlah requests harus diselesaikan di bawah 1 detik
  },
};

export default function () {
  // Kita menembak ke 'https://casir-nginx/health' karena k6 dijalankan di dalam jaringan Docker yang sama
  const res = http.get('https://casir-nginx/health');
  
  // Memvalidasi kembalian respons
  check(res, {
    'status HTTP adalah 200': (r) => r.status === 200,
    'waktu respons di bawah 500ms': (r) => r.timings.duration < 500,
  });
  
  // Beri jeda 1 detik tiap request (mensimulasikan jeda alamiah interaksi manusia/kasir)
  sleep(1);
}
