import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi tipe uji beban (Load Test)
// Target: Memastikan sistem berjalan stabil pada beban 100 kasir bersamaan
export const options = {
  insecureSkipTlsVerify: true, 
  stages: [
    { duration: '30s', target: 50 },   // Fase 1: Pemanasan bertahap ke 50 VUs
    { duration: '1m', target: 100 },   // Fase 2: Naikkan ke beban operasional tinggi (100 VUs)
    { duration: '2m', target: 100 },   // Fase 3: Tahan pada 100 VUs selama 2 menit
    { duration: '30s', target: 0 },    // Fase 4: Pendinginan ke 0 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],    // Kegagalan < 5%
    http_req_duration: ['p(90)<1000', 'p(95)<2000'], // 90% di bawah 1s, 95% di bawah 2s
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://casir-nginx';

export default function () {
  // Test Health Endpoint as baseline
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // Simulasi jeda berpikir user
  sleep(1);
}
