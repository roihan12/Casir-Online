import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi uji lonjakan (Spike Test)
// Target: Mensimulasikan flash sale atau lonjakan dadakan yang luar biasa tinggi
export const options = {
  insecureSkipTlsVerify: true, 
  stages: [
    { duration: '10s', target: 50 },    // Baseline beban ringan
    { duration: '15s', target: 1500 },  // Lonjakan drastis dalam 15 detik ke 1500 VUs!
    { duration: '30s', target: 1500 },  // Tahan sebentar
    { duration: '20s', target: 50 },    // Jatuh kembali ke baseline
    { duration: '10s', target: 0 },     // Selesai
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],    // Gagal < 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://casir-nginx';

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  
  check(res, {
    'status is 200 or 429 (rate limited)': (r) => r.status === 200 || r.status === 429,
  });

  sleep(1);
}
