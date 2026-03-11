import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi uji stres (Stress Test)
// Target: Mengetahui breaking point system dengan extreme load
export const options = {
  insecureSkipTlsVerify: true, 
  stages: [
    { duration: '1m', target: 100 },   // Fase 1: Naikkan di bawah kapasitas (100 VUs)
    { duration: '2m', target: 500 },   // Fase 2: Tarik hingga titik batas (500 VUs)
    { duration: '2m', target: 500 },   // Fase 3: Bertahan di limit
    { duration: '1m', target: 1000 },  // Fase 4: Siksa hingga batas ekstrem (1000 VUs)
    { duration: '1m', target: 0 },     // Fase 5: Recovery
  ],
  thresholds: {
    // Threshold lebih longgar di stress test
    http_req_failed: ['rate<0.15'],    // Timeout & Error diharapkan mulai terjadi
    http_req_duration: ['p(95)<5000'], // Maksimal 5 detik
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://casir-nginx';

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(0.5); // Fast interaction
}
