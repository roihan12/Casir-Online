import api from "@common/utils/api";

/**
 * Service for WhatsApp bot related operations
 * Integrates with go-whatsapp-web-multidevice v8 API
 */
const whatsappService = {
  // ==================== CONFIGURATION ====================

  /**
   * Get WhatsApp bot configurations
   * Filters by user's cabang access automatically
   * @param {Object} params - Query parameters
   * @param {string} params.cabangId - Optional: Filter by specific cabang
   * @returns {Promise<Array>} List of bot configurations
   */
  getBotConfigs: async (params = {}) => {
    try {
      const response = await api.get(`/whatsapp/config`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp bot configs:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp bot configurations" };
    }
  },

  /**
   * Get a single WhatsApp bot configuration
   * @returns {Promise<Object>} Bot configuration (first active one for user's cabang)
   * @deprecated Use getBotConfigs() instead for multi-device support
   */
  getBotConfig: async () => {
    try {
      const response = await api.get(`/whatsapp/config`);
      // Return first active config for backward compatibility
      const configs = Array.isArray(response.data) ? response.data : [];
      return configs.find(c => c.is_active) || configs[0] || null;
    } catch (error) {
      console.error("Error fetching WhatsApp bot config:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp bot configuration" };
    }
  },

  /**
   * Update WhatsApp bot configuration
   * @param {Object} config - Bot configuration data (must include cabangId)
   * @returns {Promise<Object>} Updated bot configuration
   */
  updateBotConfig: async (config) => {
    try {
      const response = await api.put(`/whatsapp/config`, config);
      return response.data;
    } catch (error) {
      console.error("Error updating WhatsApp bot config:", error);
      throw error.response?.data || { message: "Failed to update WhatsApp bot configuration" };
    }
  },

  /**
   * Create a new WhatsApp bot configuration
   * @param {Object} config - Bot configuration data (must include cabangId)
   * @returns {Promise<Object>} Created bot configuration
   */
  createBotConfig: async (config) => {
    try {
      const response = await api.put(`/whatsapp/config`, { ...config, id: undefined });
      return response.data;
    } catch (error) {
      console.error("Error creating WhatsApp bot config:", error);
      throw error.response?.data || { message: "Failed to create WhatsApp bot configuration" };
    }
  },

  // ==================== BOT STATUS & AUTH ====================

  /**
   * Get WhatsApp bot status with QR code if not connected
   * @param {string} botId - Bot configuration ID (required for multi-device)
   * @returns {Promise<Object>} Bot status information
   */
  getBotStatus: async (botId) => {
    try {
      if (!botId) {
        throw new Error('botId is required for multi-device support');
      }
      const response = await api.get(`/whatsapp/status`, { params: { botId } });
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp bot status:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp bot status" };
    }
  },

  /**
   * Restart/reconnect the WhatsApp bot
   * @param {string} botId - Bot configuration ID (optional)
   * @returns {Promise<Object>} Restart operation result
   */
  restartBot: async (botId) => {
    try {
      const response = await api.post(`/whatsapp/restart`, { botId });
      return response.data;
    } catch (error) {
      console.error("Error restarting WhatsApp bot:", error);
      throw error.response?.data || { message: "Failed to restart WhatsApp bot" };
    }
  },

  /**
   * Logout the WhatsApp bot
   * @param {string} botId - Bot configuration ID (optional)
   * @returns {Promise<Object>} Logout operation result
   */
  logoutBot: async (botId) => {
    try {
      const response = await api.post(`/whatsapp/logout`, { botId });
      return response.data;
    } catch (error) {
      console.error("Error logging out WhatsApp bot:", error);
      throw error.response?.data || { message: "Failed to logout WhatsApp bot" };
    }
  },

  // ==================== MESSAGING ====================

  /**
   * Send a text message
   * @param {string} customerId - Customer ID (optional)
   * @param {Object} data - Message data
   * @param {string} data.message - Message text
   * @param {string} data.phone - Phone number (if customerId not provided)
   * @param {string} data.botId - Bot configuration ID (optional, will use first active for user's cabang)
   * @returns {Promise<Object>} Sent message result
   */
  sendMessage: async (customerId, data) => {
    try {
      const response = await api.post(`/whatsapp/send${customerId ? `/${customerId}` : ''}`, data);
      return response.data;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error.response?.data || { message: "Failed to send message" };
    }
  },

  /**
   * Send an image message
   * @param {Object} data - Image data
   * @param {string} data.phone - Phone number
   * @param {string} data.caption - Image caption (optional)
   * @param {File|string} data.image - Image file or base64 string
   * @param {string} data.botId - Bot configuration ID (optional)
   * @returns {Promise<Object>} Sent message result
   */
  sendImage: async (data) => {
    try {
      let formData;

      if (data.image instanceof File) {
        formData = new FormData();
        formData.append('image', data.image);
        formData.append('phone', data.phone);
        if (data.caption) formData.append('caption', data.caption);
        if (data.botId) formData.append('botId', data.botId);
      } else {
        formData = data;
      }

      const response = await api.post(`/whatsapp/send-image`, formData, {
        headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
      });
      return response.data;
    } catch (error) {
      console.error("Error sending WhatsApp image:", error);
      throw error.response?.data || { message: "Failed to send image" };
    }
  },

  /**
   * Send a location
   * @param {Object} data - Location data
   * @param {string} data.phone - Phone number
   * @param {number} data.latitude - Latitude
   * @param {number} data.longitude - Longitude
   * @param {string} data.name - Location name (optional)
   * @param {string} data.address - Location address (optional)
   * @param {string} data.botId - Bot configuration ID (optional)
   * @returns {Promise<Object>} Sent message result
   */
  sendLocation: async (data) => {
    try {
      const response = await api.post(`/whatsapp/send-location`, data);
      return response.data;
    } catch (error) {
      console.error("Error sending WhatsApp location:", error);
      throw error.response?.data || { message: "Failed to send location" };
    }
  },

  /**
   * Send a poll/vote
   * @param {Object} data - Poll data
   * @param {string} data.phone - Phone number
   * @param {string} data.pollName - Poll question/name
   * @param {Array<string>} data.pollOptions - Poll options
   * @param {number} data.selectableCount - Number of selectable options (optional)
   * @param {string} data.botId - Bot configuration ID (optional)
   * @returns {Promise<Object>} Sent message result
   */
  sendPoll: async (data) => {
    try {
      const response = await api.post(`/whatsapp/send-poll`, data);
      return response.data;
    } catch (error) {
      console.error("Error sending WhatsApp poll:", error);
      throw error.response?.data || { message: "Failed to send poll" };
    }
  },

  /**
   * React to a message
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji reaction
   * @param {string} botId - Bot configuration ID (optional)
   * @returns {Promise<Object>} Reaction result
   */
  reactMessage: async (messageId, emoji, botId) => {
    try {
      const response = await api.post(`/whatsapp/message/${messageId}/react`, { emoji, botId });
      return response.data;
    } catch (error) {
      console.error(`Error reacting to message ${messageId}:`, error);
      throw error.response?.data || { message: "Failed to react to message" };
    }
  },

  // ==================== TEMPLATES ====================

  /**
   * Get all message templates
   * @returns {Promise<Array>} List of message templates
   */
  getTemplates: async () => {
    try {
      const response = await api.get(`/whatsapp/templates`);
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp templates" };
    }
  },

  /**
   * Create a new message template
   * @param {Object} template - Template data
   * @returns {Promise<Object>} Created template
   */
  createTemplate: async (template) => {
    try {
      const response = await api.post(`/whatsapp/templates`, template);
      return response.data;
    } catch (error) {
      console.error("Error creating WhatsApp template:", error);
      throw error.response?.data || { message: "Failed to create WhatsApp template" };
    }
  },

  /**
   * Update an existing message template
   * @param {string} id - Template ID
   * @param {Object} template - Updated template data
   * @returns {Promise<Object>} Updated template
   */
  updateTemplate: async (id, template) => {
    try {
      const response = await api.put(`/whatsapp/templates/${id}`, template);
      return response.data;
    } catch (error) {
      console.error(`Error updating WhatsApp template ${id}:`, error);
      throw error.response?.data || { message: "Failed to update WhatsApp template" };
    }
  },

  /**
   * Delete a message template
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteTemplate: async (id) => {
    try {
      const response = await api.delete(`/whatsapp/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting WhatsApp template ${id}:`, error);
      throw error.response?.data || { message: "Failed to delete WhatsApp template" };
    }
  },

  // ==================== CHATS ====================

  /**
   * Get all chats (conversations)
   * @param {Object} params - Query parameters
   * @param {string} params.cursor - Pagination cursor
   * @param {number} params.limit - Number of chats to return
   * @param {string} params.search - Search term
   * @param {string} params.botId - Bot configuration ID (optional)
   * @returns {Promise<Array>} List of chats
   */
  getAllChats: async (params = {}) => {
    try {
      const response = await api.get(`/whatsapp/chats`, { params });
      return response.data.results?.data || response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp chats:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp chats" };
    }
  },

  /**
   * Get messages for a specific chat
   * @param {string} chatJid - Chat JID
   * @param {Object} params - Query parameters
   * @param {string} params.cursor - Pagination cursor
   * @param {number} params.limit - Number of messages to return
   * @param {boolean} params.with_media - Filter only media messages
   * @param {string} params.botId - Bot configuration ID (optional)
   * @returns {Promise<Array>} List of messages
   */
  getChatMessages: async (chatJid, params = {}) => {
    try {
      const response = await api.get(`/whatsapp/chats/${chatJid}/messages`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching messages for chat ${chatJid}:`, error);
      throw error.response?.data || { message: "Failed to fetch chat messages" };
    }
  },

  /**
   * Get chat history for a customer
   * @param {string} customerId - ID of the customer
   * @returns {Promise<Object>} History data matching response format
   */
  getChatHistory: async (customerId) => {
    try {
      const response = await api.get(`/whatsapp/history/${customerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat history for customer ${customerId}:`, error);
      throw error.response?.data || { message: "Failed to fetch chat history" };
    }
  },

  /**
   * Get WhatsApp analysis metrics
   * @param {Object} params - Query parameters (e.g. { days: 7 })
   * @returns {Promise<Object>} Analysis Data
   */
  getAnalysis: async (params = {}) => {
    try {
      const response = await api.get(`/whatsapp/analysis`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching Analysis data:", error);
      throw error.response?.data || { message: "Failed to fetch analysis data" };
    }
  },

  // ==================== ORDERS ====================

  /**
   * Get bot orders
   * @param {Object} params - Query parameters (status, search, page, limit)
   * @returns {Promise<Object>} List of orders and metadata
   */
  getBotOrders: async (params = {}) => {
    try {
      const response = await api.get(`/whatsapp/orders`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp bot orders:", error);
      throw error.response?.data || { message: "Failed to fetch orders" };
    }
  },

  /**
   * Update bot order status
   * @param {string} id - Order ID
   * @param {string} status - New order status
   * @returns {Promise<Object>} Updated order
   */
  updateBotOrderStatus: async (id, status) => {
    try {
      const response = await api.put(`/whatsapp/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for order ${id}:`, error);
      throw error.response?.data || { message: "Failed to update order status" };
    }
  },

  // ==================== DEVICES ====================

  /**
   * Get all devices
   * @returns {Promise<Array>} List of devices
   */
  getDevices: async () => {
    try {
      const response = await api.get(`/whatsapp/devices`);
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp devices:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp devices" };
    }
  },

  /**
   * Create a new device
   * @param {string} description - Device description
   * @returns {Promise<Object>} Created device
   */
  createDevice: async (description) => {
    try {
      const response = await api.post(`/whatsapp/devices`, { description });
      return response.data;
    } catch (error) {
      console.error("Error creating WhatsApp device:", error);
      throw error.response?.data || { message: "Failed to create device" };
    }
  },

  /**
   * Remove a device
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Deletion result
   */
  removeDevice: async (deviceId) => {
    try {
      const response = await api.delete(`/whatsapp/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing device ${deviceId}:`, error);
      throw error.response?.data || { message: "Failed to remove device" };
    }
  },

  /**
   * Get device status
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Device status
   */
  getDeviceStatus: async (deviceId) => {
    try {
      const response = await api.get(`/whatsapp/devices/${deviceId}/status`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching status for device ${deviceId}:`, error);
      throw error.response?.data || { message: "Failed to fetch device status" };
    }
  },

  /**
   * Get QR code for device login
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} QR code data
   */
  loginQR: async (deviceId) => {
    try {
      const response = await api.get(`/whatsapp/devices/${deviceId}/login`);
     const data = response.data?.results || response.data;
    if (
    response.data?.code === 'ALREADY_LOGGED_IN' || 
    data?.alreadyLoggedIn
  ) {
    return {
      state: 'logged_in',
      alreadyLoggedIn: true,
      qr_link: null,
    };
  }
  

  return data;
  
    } catch (error) {
      console.error(`Error fetching QR for device ${deviceId}:`, error);
      throw error.response?.data || { message: "Failed to fetch QR code" };
    }
  },

  /**
   * Login with pairing code
   * @param {string} deviceId - Device ID
   * @param {string} phone - Phone number
   * @returns {Promise<Object>} Pairing code data
   */
  loginWithCode: async (deviceId, phone) => {
    try {
      const response = await api.post(`/whatsapp/devices/${deviceId}/login/code`, { phone });
      return response.data;
    } catch (error) {
      console.error(`Error requesting pairing code for device ${deviceId}:`, error);
      throw error.response?.data || { message: "Failed to request pairing code" };
    }
  },

  // ==================== USER INFO ====================

  /**
   * Check if phone numbers are on WhatsApp
   * @param {string|Array<string>} phones - Phone number(s)
   * @returns {Promise<Object>} Check results
   */
  checkUser: async (phones) => {
    try {
      const response = await api.post(`/whatsapp/user/check`, {
        phones: Array.isArray(phones) ? phones.join(',') : phones
      });
      return response.data;
    } catch (error) {
      console.error("Error checking user:", error);
      throw error.response?.data || { message: "Failed to check user" };
    }
  },

  /**
   * Get user information
   * @param {string} phone - Phone number
   * @returns {Promise<Object>} User info
   */
  getUserInfo: async (phone) => {
    try {
      const response = await api.get(`/whatsapp/user/info/${phone}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching info for ${phone}:`, error);
      throw error.response?.data || { message: "Failed to fetch user info" };
    }
  },

  /**
   * Get user's contacts
   * @returns {Promise<Array>} List of contacts
   */
  getMyContacts: async () => {
    try {
      const response = await api.get(`/whatsapp/user/contacts`);
      return response.data;
    } catch (error) {
      console.error("Error fetching contacts:", error);
      throw error.response?.data || { message: "Failed to fetch contacts" };
    }
  },

  /**
   * Get user's groups
   * @returns {Promise<Array>} List of groups
   */
  getMyGroups: async () => {
    try {
      const response = await api.get(`/whatsapp/user/groups`);
      return response.data;
    } catch (error) {
      console.error("Error fetching groups:", error);
      throw error.response?.data || { message: "Failed to fetch groups" };
    }
  },

  // ==================== BROADCAST ====================

  /**
   * Create a new broadcast
   * @param {Object} data - Broadcast data
   * @returns {Promise<Object>} Created broadcast
   */
  createBroadcast: async (data) => {
    try {
      const response = await api.post(`/broadcast/send`, data);
      return response.data;
    } catch (error) {
      console.error("Error creating broadcast:", error);
      throw error.response?.data || { message: "Failed to create broadcast" };
    }
  },

  /**
   * Get broadcast history
   * @returns {Promise<Array>} List of broadcasts
   */
  getBroadcastHistory: async () => {
    try {
      const response = await api.get(`/broadcast/history`);
      return response.data;
    } catch (error) {
      console.error("Error fetching broadcast history:", error);
      throw error.response?.data || { message: "Failed to fetch broadcast history" };
    }
  },

  /**
   * Get broadcast segments
   * @returns {Promise<Array>} List of segments
   */
  getBroadcastSegments: async () => {
    try {
      const response = await api.get(`/broadcast/segments`);
      return response.data;
    } catch (error) {
      console.error("Error fetching broadcast segments:", error);
      // Fallback if API fails or not implemented yet
      return { 
        success: true, 
        data: [
          { id: 'all', name: 'Semua Pelanggan' },
          { id: 'vip', name: 'Pelanggan VIP' },
          { id: 'grosir', name: 'Pelanggan Grosir' },
          { id: 'retail', name: 'Pelanggan Retail' }
        ] 
      };
    }
  },
};

export default whatsappService;
