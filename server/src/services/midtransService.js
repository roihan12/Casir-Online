const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { ResponseError } = require("../error/responseError");
require("dotenv").config();

// Midtrans configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const BASE_URL = "https://api.sandbox.midtrans.com";

// Base64 encode the server key for authorization
const getAuthHeader = () => {
  console.log(MIDTRANS_SERVER_KEY);
  const encodedKey = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
  return `${encodedKey}`;
};

// Generate QRIS code via Midtrans
const generateQRIS = async (params) => {
  try {
    const {
      transaction_id,
      gross_amount,
      customer_name,
      customer_email,
      customer_phone,
      order_items = [],
      expiry_duration = 15, // Minutes
      store_name,
    } = params;

    // Prepare the request payload
    const payload = {
      payment_type: "qris",
      transaction_details: {
        order_id: transaction_id,
        gross_amount: gross_amount,
      },
      item_details:
        order_items.length > 0
          ? order_items
          : [
              {
                id: "default-item",
                price: gross_amount,
                quantity: 1,
                name: "Payment for transaction " + transaction_id,
              },
            ],
      qris: {
        acquirer: "gopay",
      },
      customer_details: {
        first_name: customer_name || "Customer",
        email: customer_email || "customer@example.com",
        phone: customer_phone || "08123456789",
      },
      expiry: {
        unit: "minute",
        duration: expiry_duration,
      },
      custom_field1: store_name || "Store",
    };

    console.log(getAuthHeader());

    // Make the API request to Midtrans
    const response = await axios({
      method: "post",
      url: `${BASE_URL}/v2/charge`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${getAuthHeader()}`, // Use getAuthHeader(),
      },
      data: payload,
    });

    // Check for successful response
    if (response.status === 200 && response.data) {
      const result = {
        qris_url: response.data.actions
          ? response.data.actions.find(
              (action) => action.name === "generate-qr-code"
            )?.url
          : null,
        qris_id: response.data.transaction_id,
        order_id: response.data.order_id,
        status: response.data.transaction_status,
        merchant_id: response.data.merchant_id,
        gross_amount: response.data.gross_amount,
        expiry_time: new Date(Date.now() + expiry_duration * 60000), // Convert minutes to milliseconds
        actions: response.data.actions,
      };

      return result;
    } else {
      throw new Error("Failed to generate QRIS code");
    }
  } catch (error) {
    console.error(
      "Midtrans QRIS error:",
      error.response ? error.response.data : error.message
    );
    throw new ResponseError(
      error.response?.status || 500,
      error.response?.data?.error_messages?.[0] || "Failed to process payment"
    );
  }
};

// Get transaction status from Midtrans
const getTransactionStatus = async (order_id) => {
  try {
    const response = await axios({
      method: "get",
      url: `${BASE_URL}/v2/${order_id}/status`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
    });

    // Return the transaction status data
    return response.data;
  } catch (error) {
    console.error(
      "Midtrans status check error:",
      error.response ? error.response.data : error.message
    );
    throw new ResponseError(
      error.response?.status || 500,
      error.response?.data?.error_messages?.[0] ||
        "Failed to check transaction status"
    );
  }
};

// Cancel transaction on Midtrans
const cancelTransaction = async (order_id) => {
  try {
    const response = await axios({
      method: "post",
      url: `${BASE_URL}/v2/${order_id}/cancel`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
    });

    // Return the cancellation status
    return response.data;
  } catch (error) {
    console.error(
      "Midtrans cancel error:",
      error.response ? error.response.data : error.message
    );
    throw new ResponseError(
      error.response?.status || 500,
      error.response?.data?.error_messages?.[0] ||
        "Failed to cancel transaction"
    );
  }
};

// Process notification from Midtrans
const handleNotification = async (notification) => {
  try {
    // Verify the transaction status with Midtrans
    const statusResponse = await getTransactionStatus(notification.order_id);

    // Check if the signature is valid (for production environments)
    // In production, implement proper signature verification

    // Map Midtrans status to your application status
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let paymentStatus;

    // Determine payment status
    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      if (fraudStatus === "challenge") {
        paymentStatus = "PENDING"; // Need manual verification
      } else if (fraudStatus === "accept") {
        paymentStatus = "SUKSES";
      }
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      paymentStatus = "GAGAL";
    } else if (transactionStatus === "pending") {
      paymentStatus = "PENDING";
    }

    return {
      order_id: statusResponse.order_id,
      transaction_id: statusResponse.transaction_id,
      status: paymentStatus,
      amount: statusResponse.gross_amount,
      payment_type: statusResponse.payment_type,
      transaction_time: statusResponse.transaction_time,
      transaction_status: statusResponse.transaction_status,
      fraud_status: statusResponse.fraud_status,
    };
  } catch (error) {
    console.error("Midtrans notification error:", error);
    throw new ResponseError(500, "Failed to process payment notification");
  }
};

module.exports = {
  generateQRIS,
  getTransactionStatus,
  cancelTransaction,
  handleNotification,
};
