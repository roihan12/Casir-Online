const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

// Endpoint AI Dashboard Chat
router.get('/sessions', authenticate, chatController.getSessions);
router.post('/start', authenticate, chatController.startSession);
router.get('/history/:sessionId', authenticate, chatController.getHistory);
router.post('/ask', authenticate, chatController.ask);

module.exports = router;
