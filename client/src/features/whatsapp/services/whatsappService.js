import api from "@common/utils/api";

/**
 * Service for WhatsApp bot related operations
 * Integrates with go-whatsapp-web-multidevice v8 API
 */
const whatsappService = {
  // ==================== CONFIGURATION ====================

  /**
   * Get WhatsApp bot configuration
   * @returns {Promise<Object>} Bot configuration
   */
  getBotConfig: async () => {
    try {
      const response = await api.get(`/whatsapp/config`);
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp bot config:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp bot configuration" };
    }
  },

  /**
   * Update WhatsApp bot configuration
   * @param {Object} config - Bot configuration data
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

  // ==================== BOT STATUS & AUTH ====================

  /**
   * Get WhatsApp bot status with QR code if not connected
   * @returns {Promise<Object>} Bot status information
   */
  getBotStatus: async () => {
    try {
      const response = await api.get(`/whatsapp/status`);
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp bot status:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp bot status" };
    }
  },

  /**
   * Restart/reconnect the WhatsApp bot
   * @returns {Promise<Object>} Restart operation result
   */
  restartBot: async () => {
    try {
      const response = await api.post(`/whatsapp/restart`);
      return response.data;
    } catch (error) {
      console.error("Error restarting WhatsApp bot:", error);
      throw error.response?.data || { message: "Failed to restart WhatsApp bot" };
    }
  },

  /**
   * Logout the WhatsApp bot
   * @returns {Promise<Object>} Logout operation result
   */
  logoutBot: async () => {
    try {
      const response = await api.post(`/whatsapp/logout`);
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
   * @returns {Promise<Object>} Reaction result
   */
  reactMessage: async (messageId, emoji) => {
    try {
      const response = await api.post(`/whatsapp/message/${messageId}/react`, { emoji });
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
   * @returns {Promise<Array>} List of chats
   */
  getAllChats: async (params = {}) => {
    try {
      const response = await api.get(`/whatsapp/chats`, { params });
      return response.data.results.data;
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
   * Get chat history from database for a specific customer
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters for pagination
   * @param {number} params.limit - Number of messages to return
   * @returns {Promise<Array>} Chat history
   */
  getChatHistory: async (customerId, params = {}) => {
    try {
      const response = await api.get(`/whatsapp/history/${customerId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat history for customer ${customerId}:`, error);
      throw error.response?.data || { message: "Failed to fetch chat history" };
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
      const response = await api.get(`/whatsapp/devices/${deviceId}/login/qr`);
      return response.data;
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
