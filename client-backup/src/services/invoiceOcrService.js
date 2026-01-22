import axios from "axios";
import { API_URL } from "../config";

/**
 * Service for handling invoice OCR and data processing
 */
const invoiceOcrService = {
  /**
   * Process an invoice image using OCR
   * @param {FormData} formData - FormData containing the invoice image
   * @returns {Promise<Object>} OCR results
   */
  async processInvoice(formData) {
    const response = await axios.post(
      `${API_URL}/invoice/ocr/process`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Get product suggestions based on OCR data
   * @param {Object} productOcrData - Product information from OCR
   * @returns {Promise<Array>} Array of suggested products
   */
  async getProductSuggestions(productOcrData) {
    const response = await axios.post(
      `${API_URL}/invoice/ocr/suggestions`,
      productOcrData
    );
    return response.data;
  },

  /**
   * Extract invoice data using OCR from an image
   * @param {string} imageData - Base64 encoded image data
   * @returns {Promise<Object>} - Extracted invoice data
   */
  extractInvoiceData: async (imageData) => {
    try {
      const response = await axios.post(`${API_URL}/ocr/invoice`, {
        imageData,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Validate OCR results
   * @param {Object} invoiceData - The extracted invoice data
   * @returns {Promise<Object>} - Validation results
   */
  validateOcrData: async (invoiceData) => {
    try {
      const response = await axios.post(`${API_URL}/ocr/validate`, {
        invoiceData,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Submit final invoice data to create a purchase transaction
   * @param {Object} purchaseData - Purchase transaction data
   * @returns {Promise<Object>} - Created purchase transaction
   */
  submitPurchase: async (purchaseData) => {
    try {
      const response = await axios.post(`${API_URL}/purchases`, purchaseData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get supplier suggestions based on OCR data
   * @param {string} supplierInfo - Text with supplier info from OCR
   * @returns {Promise<Array>} - Suggested suppliers
   */
  getSupplierSuggestions: async (supplierInfo) => {
    try {
      const response = await axios.post(
        `${API_URL}/suppliers/ocr-suggestions`,
        {
          supplierInfo,
        }
      );
      return response.data.data || [];
    } catch (error) {
      throw error;
    }
  },
};

export default invoiceOcrService;
