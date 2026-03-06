const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const verifyWebhookSignature = require('../middleware/webhookSignatureMiddleware');

// ==================== CONFIGURATION ====================

router.get('/config', whatsappController.getConfig);
router.put('/config', whatsappController.updateConfig);

// ==================== BOT STATUS & AUTH ====================

router.get('/status', whatsappController.getStatus);
router.post('/restart', whatsappController.restartBot);
router.post('/logout', whatsappController.logoutBot);

// ==================== MESSAGING ====================

// Send text message (with optional customer lookup)
router.post('/send/:customerId?', whatsappController.sendMessage);

// Send image message
router.post('/send-image', whatsappController.sendImage);

// Send location
router.post('/send-location', whatsappController.sendLocation);

// Send poll
router.post('/send-poll', whatsappController.sendPoll);

// React to message
router.post('/message/:messageId/react', whatsappController.reactMessage);

// ==================== TEMPLATES ====================

router.get('/templates', whatsappController.getTemplates);
router.post('/templates', whatsappController.createTemplate);
router.put('/templates/:id', whatsappController.updateTemplate);
router.delete('/templates/:id', whatsappController.deleteTemplate);

// ==================== CHATS ====================

// Get chat list
router.get('/chats', whatsappController.getChats);

// Get chat messages for a specific chat
router.get('/chats/:chatJid/messages', whatsappController.getChatMessages);

// Get chat history from database (by customer)
router.get('/history/:customerId', whatsappController.getChatHistory);

// Get analysis metrics
router.get('/analysis', whatsappController.getAnalysis);

// ==================== ORDERS ====================

// Get orders
router.get('/orders', whatsappController.getOrders);

// Update order status
router.put('/orders/:id/status', whatsappController.updateOrderStatus);

// ==================== DEVICES ====================

// Get all devices
router.get('/devices', whatsappController.getDevices);

// Create new device
router.post('/devices', whatsappController.createDevice);

// Remove device
router.delete('/devices/:deviceId', whatsappController.removeDevice);

// Get device status
router.get('/devices/:deviceId/status', whatsappController.getDeviceStatus);

// Login with QR code
router.get('/devices/:deviceId/login', whatsappController.loginQR);

// Login with pairing code
router.post('/devices/:deviceId/login/code', whatsappController.loginWithCode);

// ==================== USER INFO ====================

// Check if phone numbers are on WhatsApp
router.post('/user/check', whatsappController.checkUser);

// Get user info
router.get('/user/info/:phone?', whatsappController.getUserInfo);

// Get user's contacts
router.get('/user/contacts', whatsappController.getMyContacts);

// Get user's groups
router.get('/user/groups', whatsappController.getMyGroups);

// Webhook for incoming messages (with signature verification)
router.post('/webhook', verifyWebhookSignature, whatsappController.webhook);

module.exports = router;
