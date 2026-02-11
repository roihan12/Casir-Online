const crypto = require('crypto');

/**
 * Verify webhook signature from go-whatsapp-web-multidevice
 * HMAC SHA256 signature sent in X-Hub-Signature-256 header
 *
 * Documentation: https://github.com/aldinokemal/go-whatsapp-web-multidevice/blob/main/docs/webhook-payload.md
 */
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];

  // Get webhook secret from environment
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || 'secret';

  // For development: Skip verification if explicitly disabled
  if (process.env.WHATSAPP_WEBHOOK_SKIP_VERIFICATION === 'true') {
    console.warn('WHATSAPP_WEBHOOK_SKIP_VERIFICATION is enabled - skipping signature verification (NOT RECOMMENDED FOR PRODUCTION)');
    return next();
  }

  if (!signature) {
    console.error('Webhook signature missing - request from:', req.ip);
    return res.status(401).json({ error: 'Signature missing' });
  }

  // Get raw body for signature verification
  // Note: This requires body-parser middleware with raw option configured in app.js
  const payload = req.rawBody || JSON.stringify(req.body);

  if (!payload) {
    console.error('Unable to get raw body for signature verification');
    return res.status(400).json({ error: 'Unable to verify signature' });
  }

  try {
    // Compute expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    // Extract signature value (remove 'sha256=' prefix)
    const receivedSignature = signature.replace('sha256=', '');

    // Constant-time comparison to prevent timing attacks
    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );

    if (!signatureValid) {
      console.error('Invalid webhook signature');
      console.error('Expected:', `sha256=${expectedSignature}`);
      console.error('Received:', signature);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Signature valid - proceed to next middleware
    next();
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return res.status(500).json({ error: 'Signature verification failed' });
  }
};

module.exports = verifyWebhookSignature;
