import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * Service for marketing related operations
 */
const marketingService = {
  /**
   * Get all marketing campaigns
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise<Array>} List of marketing campaigns
   */
  getCampaigns: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/marketing/campaigns`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching marketing campaigns:", error);
      throw error.response?.data || { message: "Failed to fetch marketing campaigns" };
    }
  },

  /**
   * Get a specific campaign by ID
   * @param {string} id - Campaign ID
   * @returns {Promise<Object>} Campaign data
   */
  getCampaignById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/marketing/campaigns/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching marketing campaign ${id}:`, error);
      throw error.response?.data || { message: "Failed to fetch marketing campaign" };
    }
  },

  /**
   * Create a new marketing campaign
   * @param {Object} campaign - Campaign data
   * @returns {Promise<Object>} Created campaign
   */
  createCampaign: async (campaign) => {
    try {
      const response = await axios.post(`${API_URL}/marketing/campaigns`, campaign);
      return response.data;
    } catch (error) {
      console.error("Error creating marketing campaign:", error);
      throw error.response?.data || { message: "Failed to create marketing campaign" };
    }
  },

  /**
   * Update an existing marketing campaign
   * @param {string} id - Campaign ID
   * @param {Object} campaign - Updated campaign data
   * @returns {Promise<Object>} Updated campaign
   */
  updateCampaign: async (id, campaign) => {
    try {
      const response = await axios.put(`${API_URL}/marketing/campaigns/${id}`, campaign);
      return response.data;
    } catch (error) {
      console.error(`Error updating marketing campaign ${id}:`, error);
      throw error.response?.data || { message: "Failed to update marketing campaign" };
    }
  },

  /**
   * Delete a marketing campaign
   * @param {string} id - Campaign ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteCampaign: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/marketing/campaigns/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting marketing campaign ${id}:`, error);
      throw error.response?.data || { message: "Failed to delete marketing campaign" };
    }
  },

  /**
   * Get campaign performance metrics
   * @param {string} id - Campaign ID
   * @returns {Promise<Object>} Campaign metrics
   */
  getCampaignMetrics: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/marketing/campaigns/${id}/metrics`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching metrics for campaign ${id}:`, error);
      throw error.response?.data || { message: "Failed to fetch campaign metrics" };
    }
  },

  /**
   * Get all customer segments
   * @returns {Promise<Array>} List of customer segments
   */
  getSegments: async () => {
    try {
      const response = await axios.get(`${API_URL}/marketing/segments`);
      return response.data;
    } catch (error) {
      console.error("Error fetching customer segments:", error);
      throw error.response?.data || { message: "Failed to fetch customer segments" };
    }
  },

  /**
   * Get a specific segment by ID
   * @param {string} id - Segment ID
   * @returns {Promise<Object>} Segment data
   */
  getSegmentById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/marketing/segments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching customer segment ${id}:`, error);
      throw error.response?.data || { message: "Failed to fetch customer segment" };
    }
  },

  /**
   * Create a new customer segment
   * @param {Object} segment - Segment data
   * @returns {Promise<Object>} Created segment
   */
  createSegment: async (segment) => {
    try {
      const response = await axios.post(`${API_URL}/marketing/segments`, segment);
      return response.data;
    } catch (error) {
      console.error("Error creating customer segment:", error);
      throw error.response?.data || { message: "Failed to create customer segment" };
    }
  },

  /**
   * Update an existing customer segment
   * @param {string} id - Segment ID
   * @param {Object} segment - Updated segment data
   * @returns {Promise<Object>} Updated segment
   */
  updateSegment: async (id, segment) => {
    try {
      const response = await axios.put(`${API_URL}/marketing/segments/${id}`, segment);
      return response.data;
    } catch (error) {
      console.error(`Error updating customer segment ${id}:`, error);
      throw error.response?.data || { message: "Failed to update customer segment" };
    }
  },

  /**
   * Delete a customer segment
   * @param {string} id - Segment ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteSegment: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/marketing/segments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting customer segment ${id}:`, error);
      throw error.response?.data || { message: "Failed to delete customer segment" };
    }
  },

  /**
   * Get customers in a segment
   * @param {string} id - Segment ID
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise<Array>} List of customers in the segment
   */
  getSegmentCustomers: async (id, params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/marketing/segments/${id}/customers`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching customers for segment ${id}:`, error);
      throw error.response?.data || { message: "Failed to fetch segment customers" };
    }
  },

  /**
   * Get marketing analytics data
   * @param {Object} params - Query parameters for date range and metrics
   * @returns {Promise<Object>} Analytics data
   */
  getAnalytics: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/marketing/analytics`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching marketing analytics:", error);
      throw error.response?.data || { message: "Failed to fetch marketing analytics" };
    }
  },

  /**
   * Get marketing broadcast campaigns
   * @returns {Promise<Array>} List of broadcast campaigns
   */
  getBroadcasts: async () => {
    try {
      const response = await axios.get(`${API_URL}/marketing/broadcasts`);
      return response.data;
    } catch (error) {
      console.error("Error fetching marketing broadcasts:", error);
      throw error.response?.data || { message: "Failed to fetch marketing broadcasts" };
    }
  },

  /**
   * Create a new broadcast campaign
   * @param {Object} broadcast - Broadcast campaign data
   * @returns {Promise<Object>} Created broadcast
   */
  createBroadcast: async (broadcast) => {
    try {
      const response = await axios.post(`${API_URL}/marketing/broadcasts`, broadcast);
      return response.data;
    } catch (error) {
      console.error("Error creating marketing broadcast:", error);
      throw error.response?.data || { message: "Failed to create marketing broadcast" };
    }
  },

  /**
   * Get broadcast campaign by ID
   * @param {string} id - Broadcast ID
   * @returns {Promise<Object>} Broadcast data
   */
  getBroadcastById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/marketing/broadcasts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching marketing broadcast ${id}:`, error);
      throw error.response?.data || { message: "Failed to fetch marketing broadcast" };
    }
  },

  /**
   * Update broadcast campaign
   * @param {string} id - Broadcast ID
   * @param {Object} broadcast - Updated broadcast data
   * @returns {Promise<Object>} Updated broadcast
   */
  updateBroadcast: async (id, broadcast) => {
    try {
      const response = await axios.put(`${API_URL}/marketing/broadcasts/${id}`, broadcast);
      return response.data;
    } catch (error) {
      console.error(`Error updating marketing broadcast ${id}:`, error);
      throw error.response?.data || { message: "Failed to update marketing broadcast" };
    }
  },

  /**
   * Delete broadcast campaign
   * @param {string} id - Broadcast ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteBroadcast: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/marketing/broadcasts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting marketing broadcast ${id}:`, error);
      throw error.response?.data || { message: "Failed to delete marketing broadcast" };
    }
  }
};

export default marketingService;
