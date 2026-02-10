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
 */
exports.webhook = async (req, res) => {
  try {
    const data = req.body;
    console.log('WhatsApp Webhook:', JSON.stringify(data, null, 2));

    // Get IO instance
    const io = req.app.get('io');
    if (io) {
      io.emit('whatsapp_message', data);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ message: error.message });
  }
};
