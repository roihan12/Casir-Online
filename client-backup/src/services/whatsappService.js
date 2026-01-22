import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * Service for WhatsApp bot related operations
 */
const whatsappService = {
  /**
   * Get WhatsApp bot configuration
   * @returns {Promise<Object>} Bot configuration
   */
  getBotConfig: async () => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/config`);
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
      const response = await axios.put(`${API_URL}/whatsapp/config`, config);
      return response.data;
    } catch (error) {
      console.error("Error updating WhatsApp bot config:", error);
      throw error.response?.data || { message: "Failed to update WhatsApp bot configuration" };
    }
  },

  /**
   * Get WhatsApp bot status
   * @returns {Promise<Object>} Bot status information
   */
  getBotStatus: async () => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/status`);
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp bot status:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp bot status" };
    }
  },

  /**
   * Restart the WhatsApp bot
   * @returns {Promise<Object>} Restart operation result
   */
  restartBot: async () => {
    try {
      const response = await axios.post(`${API_URL}/whatsapp/restart`);
      return response.data;
    } catch (error) {
      console.error("Error restarting WhatsApp bot:", error);
      throw error.response?.data || { message: "Failed to restart WhatsApp bot" };
    }
  },

  /**
   * Get all message templates
   * @returns {Promise<Array>} List of message templates
   */
  getTemplates: async () => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/templates`);
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp templates" };
    }
  },

  /**
   * Get a specific template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Template data
   */
  getTemplateById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching WhatsApp template ${id}:`, error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp template" };
    }
  },

  /**
   * Create a new message template
   * @param {Object} template - Template data
   * @returns {Promise<Object>} Created template
   */
  createTemplate: async (template) => {
    try {
      const response = await axios.post(`${API_URL}/whatsapp/templates`, template);
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
      const response = await axios.put(`${API_URL}/whatsapp/templates/${id}`, template);
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
      const response = await axios.delete(`${API_URL}/whatsapp/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting WhatsApp template ${id}:`, error);
      throw error.response?.data || { message: "Failed to delete WhatsApp template" };
    }
  },

  /**
   * Get AI agent configuration
   * @returns {Promise<Object>} AI agent configuration
   */
  getAIConfig: async () => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/ai-config`);
      return response.data;
    } catch (error) {
      console.error("Error fetching AI agent config:", error);
      throw error.response?.data || { message: "Failed to fetch AI agent configuration" };
    }
  },

  /**
   * Update AI agent configuration
   * @param {Object} config - AI configuration data
   * @returns {Promise<Object>} Updated AI configuration
   */
  updateAIConfig: async (config) => {
    try {
      const response = await axios.put(`${API_URL}/whatsapp/ai-config`, config);
      return response.data;
    } catch (error) {
      console.error("Error updating AI agent config:", error);
      throw error.response?.data || { message: "Failed to update AI agent configuration" };
    }
  },

  /**
   * Get AI agent performance statistics
   * @param {Object} params - Query parameters for filtering stats
   * @returns {Promise<Object>} AI performance stats
   */
  getAIStats: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/ai-stats`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching AI agent stats:", error);
      throw error.response?.data || { message: "Failed to fetch AI agent statistics" };
    }
  },

  /**
   * Get chat history for a specific customer
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise<Array>} Chat history
   */
  getChatHistory: async (customerId, params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/chats/${customerId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat history for customer ${customerId}:`, error);
      throw error.response?.data || { message: "Failed to fetch chat history" };
    }
  },

  /**
   * Send a message to a customer
   * @param {string} customerId - Customer ID
   * @param {Object} message - Message data
   * @returns {Promise<Object>} Sent message
   */
  sendMessage: async (customerId, message) => {
    try {
      const response = await axios.post(`${API_URL}/whatsapp/send/${customerId}`, message);
      return response.data;
    } catch (error) {
      console.error(`Error sending message to customer ${customerId}:`, error);
      throw error.response?.data || { message: "Failed to send message" };
    }
  },

  /**
   * Get broadcast campaigns
   * @returns {Promise<Array>} List of broadcast campaigns
   */
  getBroadcasts: async () => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/broadcasts`);
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp broadcasts:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp broadcasts" };
    }
  },

  /**
   * Create a new broadcast campaign
   * @param {Object} broadcast - Broadcast campaign data
   * @returns {Promise<Object>} Created broadcast
   */
  createBroadcast: async (broadcast) => {
    try {
      const response = await axios.post(`${API_URL}/whatsapp/broadcasts`, broadcast);
      return response.data;
    } catch (error) {
      console.error("Error creating WhatsApp broadcast:", error);
      throw error.response?.data || { message: "Failed to create WhatsApp broadcast" };
    }
  },

  /**
   * Get orders created through WhatsApp
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise<Array>} List of WhatsApp orders
   */
  getOrders: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/orders`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp orders:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp orders" };
    }
  },

  /**
   * Get analytics data for WhatsApp bot
   * @param {Object} params - Query parameters for date range and metrics
   * @returns {Promise<Object>} Analytics data
   */
  getAnalytics: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/analytics`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp analytics:", error);
      throw error.response?.data || { message: "Failed to fetch WhatsApp analytics" };
    }
  }
};

export default whatsappService;
