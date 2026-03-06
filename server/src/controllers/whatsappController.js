const whatsappService = require('../services/whatsappService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get active bot configuration
 */
exports.getConfig = async (req, res) => {
  try {
    const config = await prisma.$queryRawUnsafe(
      `SELECT bot_config_id, cabang_id, platform_type, is_active, api_key, api_secret, phone_number, webhook_url, welcome_message, catalog_message, order_message, thank_you_message, created_at, updated_at, "name", api_url, device_id
      FROM bot_config`
    )
  
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update or create bot configuration
 */
exports.updateConfig = async (req, res) => {
  try {
    const data = req.body;
    const config = await prisma.botConfig.upsert({
      where: { id: data.id || 'default' },
      update: data,
      create: data,
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get bot connection status with QR code if not connected
 */
exports.getStatus = async (req, res) => {
  try {
    // Get active config
    const config = await prisma.$queryRawUnsafe(
      `SELECT bot_config_id, cabang_id, platform_type, is_active, api_key, api_secret, phone_number, webhook_url, welcome_message, catalog_message, order_message, thank_you_message, created_at, updated_at, "name", api_url, device_id
      FROM bot_config`
    )

    // Get the first config from array (or handle properly)
    const botConfig = Array.isArray(config) ? config[0] : config;

    if (!botConfig) {
      return res.status(404).json({ message: 'No active bot configuration found' });
    }

    // Get devices from Go Service
    let myDevice;
    try {
      const response = await whatsappService.getDevices();
      const devices = response.data || response.results || response || [];

      myDevice = devices.find(d => d.id === botConfig.device_id || d.uuid === botConfig.device_id);

      if (myDevice === undefined) {
        try {
          const createResponse = await whatsappService.createDevice(botConfig.device_id);
        } catch (e) {
          console.error('Error creating device:', e);
        }
      }

    } catch (e) {
      console.error('Error getting devices:', e.message);
    }


  
  
    let qrCode = null;
    let qrDuration = null;
    if (myDevice?.state !== 'connected') {
      try {
        // Use /app/login endpoint with device_id parameter
        const loginResponse = await whatsappService.appLogin(myDevice.id);

        // Log the full response for debugging
        console.log('Login QR Response:', JSON.stringify(loginResponse, null, 2));

        // Extract QR code - try multiple possible response structures
        if (loginResponse && loginResponse.results) {
            qrCode = loginResponse.results.qr_link;
            qrDuration = loginResponse.results.qr_duration;
        } else if (loginResponse && loginResponse.data) {
             qrCode = loginResponse.data.qr_link;
             qrDuration = loginResponse.data.qr_duration;
        }
      } catch (e) {
        console.error('Error fetching QR:', e.message);
        console.error('Full error:', e);
      }
    }

    const status = {
      state: myDevice?.state,
      deviceId: botConfig.device_id,
      qrDuration: qrDuration,
      qrCode: qrCode
    };

    res.json(status);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Restart/reconnect the bot
 */
exports.restartBot = async (req, res) => {
  try {
    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });

    if (!config) {
      return res.status(404).json({ message: 'No active bot configuration found' });
    }

    if (config.deviceId) {
      await whatsappService.reconnect(config.deviceId);
    }

    res.json({ message: 'Bot reconnecting...' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Logout the bot
 */
exports.logoutBot = async (req, res) => {
  try {
    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });

    if (!config) {
      return res.status(404).json({ message: 'No active bot configuration found' });
    }

    if (config.deviceId) {
      await whatsappService.logout(config.deviceId);
    }

    res.json({ message: 'Bot logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Send text message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { message, phone } = req.body;

    let targetPhone = phone;
    if (!targetPhone && customerId) {
      const customer = await prisma.pelanggan.findUnique({ where: { id: customerId } });
      targetPhone = customer?.telepon;
    }

    if (!targetPhone) {
      return res.status(400).json({ message: 'Phone number required' });
    }

    const config = await prisma.$queryRawUnsafe(
      `SELECT device_id
      FROM bot_config`
    )

    // Get the first config from array (or handle properly)
    const botConfig = Array.isArray(config) ? config[0] : config;

    if (!botConfig?.device_id) {
      return res.status(500).json({ message: 'Bot not configured or device missing' });
    }

    const result = await whatsappService.sendMessage(targetPhone, message, botConfig.device_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Send image message
 */
exports.sendImage = async (req, res) => {
  try {
    const { phone, caption } = req.body;

    if (!req.file && !req.body.image) {
      return res.status(400).json({ message: 'Image file required' });
    }

    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });
    if (!config?.deviceId) {
      return res.status(500).json({ message: 'Bot not configured or device missing' });
    }

    const imageBuffer = req.file ? req.file.buffer : Buffer.from(req.body.image, 'base64');
    const filename = req.file ? req.file.originalname : 'image.jpg';

    const result = await whatsappService.sendImage(
      phone,
      imageBuffer,
      filename,
      config.deviceId,
      { caption }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Send location
 */
exports.sendLocation = async (req, res) => {
  try {
    const { phone, latitude, longitude, name, address } = req.body;

    if (!phone || !latitude || !longitude) {
      return res.status(400).json({ message: 'Phone, latitude, and longitude are required' });
    }

    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });
    if (!config?.deviceId) {
      return res.status(500).json({ message: 'Bot not configured or device missing' });
    }

    const result = await whatsappService.sendLocation(
      phone,
      parseFloat(latitude),
      parseFloat(longitude),
      config.deviceId,
      { name, address }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get message templates
 */
exports.getTemplates = async (req, res) => {
  try {
    const templates = await prisma.botTemplate.findMany();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create message template
 */
exports.createTemplate = async (req, res) => {
  try {
    const template = await prisma.botTemplate.create({
      data: req.body
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update message template
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await prisma.botTemplate.update({
      where: { id },
      data: req.body
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete message template
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.botTemplate.delete({
      where: { id }
    });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get chat list
 */
exports.getChats = async (req, res) => {
  try {
    const config = await prisma.$queryRawUnsafe(
      `SELECT device_id
      FROM bot_config`
    )

    // Get the first config from array (or handle properly)
    const botConfig = Array.isArray(config) ? config[0] : config;


    if (!botConfig?.device_id) {
      return res.json([]);
    }

    const { cursor, limit, search } = req.query;
    const chats = await whatsappService.getChats(botConfig.device_id, { cursor, limit, search });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get chat messages
 */
exports.getChatMessages = async (req, res) => {
  try {
    const config = await prisma.$queryRawUnsafe(
      `SELECT device_id
      FROM bot_config`
    )

    // Get the first config from array (or handle properly)
    const botConfig = Array.isArray(config) ? config[0] : config;

    const { cursor, limit, with_media } = req.query;
    const { chatJid } = req.params;
    const messages = await whatsappService.getChatMessages(chatJid, botConfig.device_id, {
      cursor,
      limit,
      with_media
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get chat history (from database)
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 50 } = req.query;

    const messages = await prisma.whatsappMessage.findMany({
      where: { customerId },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get device list
 */
exports.getDevices = async (req, res) => {
  try {
    const response = await whatsappService.getDevices();
    const devices = response.data || response.results || response || [];
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create new device
 */
exports.createDevice = async (req, res) => {
  try {
    const { description } = req.body;
    const result = await whatsappService.createDevice(description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove device
 */
exports.removeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await whatsappService.removeDevice(deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get device status
 */
exports.getDeviceStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await whatsappService.getDeviceStatus(deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Login with QR code
 * Note: Uses /app/login endpoint with device_id parameter
 */
exports.loginQR = async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }

    const result = await whatsappService.appLogin(deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Login with pairing code
 * Note: Uses /app/login-with-code endpoint with device_id parameter
 */
exports.loginWithCode = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { phone } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const result = await whatsappService.appLoginWithCode(deviceId, phone);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Check if phone number is on WhatsApp
 */
exports.checkUser = async (req, res) => {
  try {
    const { phones } = req.body;

    if (!phones) {
      return res.status(400).json({ message: 'Phone number(s) required' });
    }

    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });
    const result = await whatsappService.checkUser(phones, config?.deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user info
 */
exports.getUserInfo = async (req, res) => {
  try {
    const { phone } = req.params;

    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });
    const result = await whatsappService.getUserInfo(phone, config?.deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user's contacts
 */
exports.getMyContacts = async (req, res) => {
  try {
    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });

    if (!config?.deviceId) {
      return res.status(500).json({ message: 'Bot not configured' });
    }

    const result = await whatsappService.getMyContacts(config.deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user's groups
 */
exports.getMyGroups = async (req, res) => {
  try {
    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });

    if (!config?.deviceId) {
      return res.status(500).json({ message: 'Bot not configured' });
    }

    const result = await whatsappService.getMyGroups(config.deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Send poll
 */
exports.sendPoll = async (req, res) => {
  try {
    const { phone, pollName, pollOptions, selectableCount } = req.body;

    if (!phone || !pollName || !pollOptions) {
      return res.status(400).json({ message: 'Phone, poll name, and poll options are required' });
    }

    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });
    if (!config?.deviceId) {
      return res.status(500).json({ message: 'Bot not configured' });
    }

    const result = await whatsappService.sendPoll(
      phone,
      pollName,
      pollOptions,
      config.deviceId,
      { selectable_count: selectableCount }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * React to message
 */
exports.reactMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const config = await prisma.botConfig.findFirst({ where: { isActive: true } });
    if (!config?.deviceId) {
      return res.status(500).json({ message: 'Bot not configured' });
    }

    const result = await whatsappService.reactMessage(messageId, emoji, config.deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * Webhook handler for incoming WhatsApp messages
 * POST /api/whatsapp/webhook
 *
 * Payload structure from go-whatsapp-web-multidevice:
 * {
 *   "event": "message | message.reaction | message.ack | group.participants | message.revoked | message.edited",
 *   "device_id": "628123456789@s.whatsapp.net",
 *   "payload": { ... }
 * }
 *
 * Documentation: https://github.com/aldinokemal/go-whatsapp-web-multidevice/blob/main/docs/webhook-payload.md
 */
exports.webhook = async (req, res) => {
  try {
    const data = req.body;
    console.log('WhatsApp Webhook Event:', data.event);
    console.log('WhatsApp Webhook Payload:', data);

    // Get IO instance for real-time push to frontend
    const io = req.app.get('io');

    // Route to appropriate handler based on event type
    switch (data.event) {
      case 'message':
        await handleMessage(data.payload, data.device_id, io);
        break;

      case 'message.ack':
        await handleMessageAck(data.payload, data.device_id, io);
        break;

      case 'message.reaction':
        await handleMessageReaction(data.payload, data.device_id, io);
        break;

      case 'message.revoked':
        await handleMessageRevoked(data.payload, data.device_id, io);
        break;

      case 'message.edited':
        await handleMessageEdited(data.payload, data.device_id, io);
        break;

      case 'group.participants':
        await handleGroupParticipants(data.payload, data.device_id, io);
        break;

      default:
        console.log('Unhandled webhook event:', data.event);
        // Still emit unknown events
        if (io) {
          io.emit('whatsapp_message', data);
        }
    }

    // Always respond quickly (webhook timeout is 10 seconds)
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    // Still return 200 to prevent webhook retries (if error is logged/handled)
    res.status(500).json({ message: error.message });
  }
};

/**
 * Handle incoming message (text, media, location, contact, etc.)
 */
async function handleMessage(payload, deviceId, io) {
  const { id, chat_id, from, from_name, timestamp, body, image, video, audio, document, sticker, location, contact, extendedTextMessage } = payload;

  // Determine message type and content
  let messageType = 'text';
  let content = body || extendedTextMessage?.text || null;
  let mediaUrl = null;

  if (image) {
    messageType = 'image';
    mediaUrl = typeof image === 'string' ? image : (image.url || null);
    content = (typeof image === 'object' && image.caption) ? image.caption : content;
  } else if (video) {
    messageType = 'video';
    mediaUrl = typeof video === 'string' ? video : (video.url || null);
  } else if (audio) {
    messageType = 'audio';
    mediaUrl = typeof audio === 'string' ? audio : (audio.url || null);
  } else if (document) {
    messageType = 'document';
    mediaUrl = typeof document === 'string' ? document : (document.url || null);
  } else if (sticker) {
    messageType = 'sticker';
    mediaUrl = sticker;
  } else if (location) {
    messageType = 'location';
    content = JSON.stringify(location);
  } else if (contact) {
    messageType = 'contact';
    content = JSON.stringify(contact);
  }

  // Extract phone number from JID (remove @s.whatsapp.net)
  const fromPhone = from.replace('@s.whatsapp.net', '');

  // Log incoming message to the database
  try {
    let msgDate = new Date();
    if (timestamp) {
      if (typeof timestamp === 'number') {
        msgDate = new Date(timestamp * 1000); // Unix timestamp in seconds
      } else {
        msgDate = new Date(timestamp);
      }
    }

    await prisma.whatsappMessage.create({
      data: {
        messageId: id || `msg_${Date.now()}`,
        chatId: chat_id || from,
        deviceId: deviceId || 'unknown',
        fromPhone: fromPhone,
        fromName: from_name || null,
        messageType: messageType,
        body: content,
        mediaUrl: mediaUrl,
        timestamp: msgDate,
        status: 'received'
      }
    });
  } catch (err) {
    if (err.code !== 'P2002') { // ignore duplicate messageId conflicts
        console.error("Failed to log WhatsappMessage to DB:", err);
    }
  }

  // Retrieve active bot config (to fetch messages and settings)
  let activeBotConfig = null;
  try {
      const configRows = await prisma.$queryRawUnsafe(
        `SELECT bot_config_id, cabang_id, platform_type, is_active, api_key, api_secret, phone_number, webhook_url, welcome_message, catalog_message, order_message, thank_you_message, created_at, updated_at, "name", api_url, device_id
        FROM bot_config WHERE is_active = true LIMIT 1`
      );
      if (configRows && configRows.length > 0) {
          activeBotConfig = configRows[0];
      }
  } catch (e) {
      console.error("Failed to fetch bot config in webhook:", e);
  }

  // --- AI Customer Service & Self-Ordering Logic ---
  if (messageType === 'text' && content && activeBotConfig) {
      const textLower = content.trim().toLowerCase();
      let replyMessage = null;

      // Check session to see if CS is handling it manually
      let session = await prisma.botSession.findFirst({
          where: { platformUserId: fromPhone, botConfigId: activeBotConfig.bot_config_id }
      });

      // Initialize session if not exist
      if (!session) {
          session = await prisma.botSession.create({
              data: {
                  platformUserId: fromPhone,
                  botConfigId: activeBotConfig.bot_config_id,
                  sessionStatus: 'active',
                  lastInteraction: new Date(),
                  sessionData: {}
              }
          });
      }

      // If user types 'cs' or 'admin', manual handover
      if (textLower === 'cs' || textLower === 'admin' || textLower === 'bantuan') {
          await prisma.botSession.update({
              where: { id: session.id },
              data: { sessionStatus: 'idle' } // Deactivate bot, CS takes over
          });
          replyMessage = "Baik, CS kami akan segera membantu Anda. Mohon tunggu sebentar.";
      } 
      else if (session.sessionStatus === 'active') {
          // --- AI-Based Chatbot (Gemini) ---
          try {
              const geminiService = require('../services/geminiService');
              const aiResponse = await geminiService.generateBotResponse(content, activeBotConfig, session);
              
              replyMessage = aiResponse.reply;

              // Save conversational context
              await prisma.botSession.update({
                  where: { id: session.id },
                  data: {
                      sessionData: {
                          history: aiResponse.newHistory
                      }
                  }
              });

              // Send Websocket Notification if order was placed inside Gemini Tooling
              if (io && aiResponse.hasOrdered) {
                  io.emit('new_bot_order', {
                      phone: fromPhone,
                      cabangId: activeBotConfig.cabang_id
                  });
              }

          } catch (aiErr) {
              console.error("AI Handling error:", aiErr);
              replyMessage = "Mohon maaf, layanan AI CS kami sedang sibuk/gangguan. Mohon ketik *CS* untuk dibantu admin.";
          }
      }

      // Send the auto-reply if exists
      if (replyMessage) {
          try {
              const whatsappService = require('../services/whatsappService');
              // const wService = new whatsappService();
              
              let formattedPhone = fromPhone;
              if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1);
              if (!formattedPhone.endsWith('@s.whatsapp.net')) formattedPhone += '@s.whatsapp.net';

              let botDeviceId = activeBotConfig?.device_id || deviceId;
              if (botDeviceId && botDeviceId.includes('@s.whatsapp.net')) {
                botDeviceId = botDeviceId.replace('@s.whatsapp.net', '');
              }

              await whatsappService.sendMessage(formattedPhone, replyMessage, botDeviceId);
          } catch (replyErr) {
              console.error("Failed to send auto-reply via webhook:", replyErr);
          }
      }
  }
  // --- End Auto-Reply Logic ---

  // Try to find customer by phone number
  let customerId = null;
  let branchId = null;
  // try {
  //   // Normalize phone number (remove +, spaces, etc.)
  //   const normalizedPhone = fromPhone.replace(/[^0-9]/g, '');

  //   // Try to find customer with this phone
  //   const customer = await prisma.pelanggan.findFirst({
  //     where: {
  //       OR: [
  //         { telepon: { contains: normalizedPhone } },
  //         { noHp: { contains: normalizedPhone } },
  //         { telepon: fromPhone },
  //         { noHp: fromPhone },
  //       ]
  //     },
  //     select: { id: true, cabangId: true }
  //   });

  //   if (customer) {
  //     customerId = customer.id;
  //     branchId = customer.cabangId;
  //   }
  // } catch (err) {
  //   // Customer lookup failed, continue without it
  //   console.error('Customer lookup failed:', err.message);
  // }

  // // Store message in database
  // try {
  //   await prisma.whatsappMessage.create({
  //     data: {
  //       messageId: id,
  //       chatId: chat_id,
  //       deviceId: deviceId,
  //       fromPhone: fromPhone,
  //       fromName: from_name || null,
  //       messageType: messageType,
  //       body: content,
  //       mediaUrl: mediaUrl,
  //       timestamp: new Date(timestamp),
  //       status: 'sent',
  //       customerId: customerId,
  //       branchId: branchId
  //     }
  //   });
  //   console.log(`Message stored: ${id} from ${from_name || fromPhone}`);
  // } catch (dbError) {
  //   // Ignore duplicate errors (idempotent processing)
  //   if (dbError.code === 'P2002' || dbError.message?.includes('unique constraint')) {
  //     console.log(`Duplicate message ignored: ${id}`);
  //   } else {
  //     console.error('Error saving message to DB:', dbError);
  //   }
  // }

  // Push to connected clients via Socket.IO
  if (io) {
    io.emit('whatsapp_message', {
      type: 'message',
      device_id: deviceId,
      data: payload
    });
  }
}

/**
 * Handle message acknowledgment (delivered/read)
 */
async function handleMessageAck(payload, deviceId, io) {
  const { ids, chat_id, from, receipt_type, receipt_type_description } = payload;

  console.log(`Message ACK: ${receipt_type} for ${ids.length} message(s)`);

  // Update message status in database
  try {
    await prisma.whatsappMessage.updateMany({
      where: {
        messageId: { in: ids },
        deviceId: deviceId
      },
      data: {
        status: receipt_type === 'read' ? 'read' : 'delivered',
        readAt: receipt_type === 'read' ? new Date() : null
      }
    });
  } catch (dbError) {
    console.error('Error updating message ACK status:', dbError);
  }

  // Push to connected clients
  if (io) {
    io.emit('whatsapp_message', {
      type: 'ack',
      device_id: deviceId,
      data: payload
    });
  }
}

/**
 * Handle message reaction
 */
async function handleMessageReaction(payload, deviceId, io) {
  const { id, chat_id, from, from_name, reaction, reacted_message_id } = payload;

  console.log(`Message reaction: ${reaction} on message ${reacted_message_id}`);

  // Store or update reaction in database (optional)
  // You could add a reactions table or store it in message metadata

  // Push to connected clients
  if (io) {
    io.emit('whatsapp_message', {
      type: 'reaction',
      device_id: deviceId,
      data: payload
    });
  }
}

/**
 * Handle message revoked/deleted
 */
async function handleMessageRevoked(payload, deviceId, io) {
  const { id, chat_id, from, from_name, revoked_message_id, revoked_from_me } = payload;

  console.log(`Message revoked: ${revoked_message_id}`);

  // Mark message as deleted in database
  try {
    await prisma.whatsappMessage.updateMany({
      where: {
        messageId: revoked_message_id,
        deviceId: deviceId
      },
      data: {
        deletedAt: new Date()
      }
    });
  } catch (dbError) {
    console.error('Error marking message as deleted:', dbError);
  }

  // Push to connected clients
  if (io) {
    io.emit('whatsapp_message', {
      type: 'revoked',
      device_id: deviceId,
      data: payload
    });
  }
}

/**
 * Handle message edited
 */
async function handleMessageEdited(payload, deviceId, io) {
  const { id, chat_id, from, from_name, timestamp, original_message_id, body } = payload;

  console.log(`Message edited: ${original_message_id}`);

  // Update message in database
  try {
    await prisma.whatsappMessage.updateMany({
      where: {
        messageId: original_message_id,
        deviceId: deviceId
      },
      data: {
        body: body,
        editedAt: new Date(timestamp)
      }
    });
  } catch (dbError) {
    console.error('Error updating edited message:', dbError);
  }

  // Push to connected clients
  if (io) {
    io.emit('whatsapp_message', {
      type: 'edited',
      device_id: deviceId,
      data: payload
    });
  }
}

/**
 * Handle group participants changes
 */
async function handleGroupParticipants(payload, deviceId, io) {
  const { chat_id, type, jids } = payload;

  console.log(`Group participants: ${type} ${jids.length} member(s) in ${chat_id}`);

  // You could store group metadata or trigger notifications

  // Push to connected clients
  if (io) {
    io.emit('whatsapp_message', {
      type: 'group_participants',
      device_id: deviceId,
      data: payload
    });
  }
}

/**
 * Get bot orders
 */
exports.getOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    if (status && status !== 'All') {
      where.orderStatus = status.toLowerCase(); // Map frontend "Pending" to "pending"
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { session: { platformUserId: { contains: search } } }
      ];
    }

    // Include relations
    const include = {
      session: {
        include: {
          pelanggan: true
        }
      },
      transaksi: true
    };

    // Get data
    const [orders, totalRecords] = await Promise.all([
      prisma.botOrder.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.botOrder.count({ where })
    ]);

    // Map to frontend expected format
    const mappedOrders = orders.map(order => {
      // Calculate items and total (placeholder total if not in orderData)
      let itemsCount = 0;
      let total = 0;
      
      try {
        if (Array.isArray(order.orderData)) {
           itemsCount = order.orderData.reduce((acc, item) => acc + (item.qty || 1), 0);
           // If JSON has price, calculate it. Otherwise 0.
           total = order.orderData.reduce((acc, item) => acc + ((item.qty || 1) * (item.price || 0)), 0);
        }
      } catch (e) {}

      // Override total with actual Transaksi total if exists
      if (order.transaksi) {
        total = Number(order.transaksi.total_akhir || order.transaksi.total_amount || 0);
      }

      // Map status
      let formattedStatus = 'Pending';
      if (order.orderStatus) {
        formattedStatus = order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1);
      }

      return {
        id: order.id,
        customer: order.session?.pelanggan?.nama || order.session?.platformUserId || 'Unknown Customer',
        date: new Date(order.createdAt).toISOString().slice(0, 16).replace('T', ' '),
        items: itemsCount,
        total: total,
        status: formattedStatus,
        paymentStatus: order.transaksi?.status_pembayaran === 'lunas' ? 'Paid' : 'Unpaid',
        rawOriginalData: order
      };
    });

    res.json({
      data: mappedOrders,
      meta: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update bot order status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: 'Order ID and status are required' });
    }

    const updatedOrder = await prisma.botOrder.update({
      where: { id },
      data: { orderStatus: status.toLowerCase() }
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Analysis Metrics
 */
exports.getAnalysis = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    // 1. Total Pesan Masuk (Pesan dari user/bukan dari device)
    const totalPesan = await prisma.whatsappMessage.count({
      where: {
        createdAt: { gte: dateLimit },
        fromPhone: { not: '' } // Assumption: user messages have fromPhone
      }
    });

    // 2. Total Sesi Bot
    const sessionCount = await prisma.botSession.count({
      where: {
        createdAt: { gte: dateLimit }
      }
    });

    // 3. Pesanan via WA
    const totalOrders = await prisma.botOrder.count({
      where: {
        createdAt: { gte: dateLimit }
      }
    });

    // 4. Total Penjualan
    const completedOrders = await prisma.botOrder.findMany({
      where: {
        createdAt: { gte: dateLimit },
        orderStatus: 'completed'
      },
      include: {
        transaksi: true
      }
    });
    
    let totalPenjualan = 0;
    completedOrders.forEach(order => {
      if (order.transaksi) {
        totalPenjualan += Number(order.transaksi.total_akhir || order.transaksi.total_amount || 0);
      } else if (order.orderData && Array.isArray(order.orderData)) {
        totalPenjualan += order.orderData.reduce((acc, item) => acc + ((item.qty || 1) * (item.price || 0)), 0);
      }
    });

    // 5. Volume Pesan Harian (Group by Date)
    const rawMessages = await prisma.whatsappMessage.findMany({
      where: {
        createdAt: { gte: dateLimit }
      },
      select: {
        createdAt: true
      }
    });
    
    // Grouping by YYYY-MM-DD
    const volumeHarianMap = {};
    rawMessages.forEach(msg => {
      if(msg.createdAt) {
        const dateStr = msg.createdAt.toISOString().slice(0, 10);
        volumeHarianMap[dateStr] = (volumeHarianMap[dateStr] || 0) + 1;
      }
    });
    
    // Format to array and sort by date
    const volumeHarian = Object.entries(volumeHarianMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));


    // 6. Analisis Status Pesanan (Untuk Grafik 2 / Pie Chart)
    const orderStatuses = await prisma.botOrder.groupBy({
      by: ['orderStatus'],
      where: {
        createdAt: { gte: dateLimit }
      },
      _count: {
        orderStatus: true
      }
    });

    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    };
    
    orderStatuses.forEach(stat => {
      statusCounts[stat.orderStatus] = stat._count.orderStatus;
    });

    res.json({
      metrics: {
        totalPesan,
        sessionCount,
        totalOrders,
        totalPenjualan
      },
      charts: {
        volumeHarian,
        orderStatuses: statusCounts
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
