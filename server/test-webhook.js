const mockNotification = {
  "transaction_time": "2026-03-04 01:21:04",
  "transaction_status": "settlement",
  "transaction_id": "893c837f-271d-4444-9844-4860b299a9b6",
  "status_message": "midtrans payment notification",
  "status_code": "200",
  "signature_key": "some-hash",
  "payment_type": "bank_transfer",
  "order_id": "INV-SSO-0001-20260304-0004",
  "merchant_id": "G483174243",
  "gross_amount": "15000.00",
  "fraud_status": "accept",
  "currency": "IDR",
  "approval_code": "1741026065406"
};

const axios = require('axios');
axios.post('http://localhost:5000/api/payment/webhook/midtrans', mockNotification)
  .then(r => console.log('Response:', r.status, r.data))
  .catch(e => console.error('Error:', e.response?.data || e.message));
