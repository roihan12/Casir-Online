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

    console.log(params);

    // Calculate the sum of all item prices * quantities
    // Midtrans requires integer values for IDR (no decimals)
    const calculateItemsSum = (items) => {
      return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    // Use the calculated sum from items instead of the provided gross_amount
    // This ensures gross_amount always matches item_details sum
    const itemsToUse = order_items.length > 0 ? order_items : [
      {
        id: "default-item",
        price: Math.round(gross_amount),
        quantity: 1,
        name: "Payment for transaction " + transaction_id,
      },
    ];

    // Ensure all prices are integers and calculate gross amount
    const normalizedItems = itemsToUse.map(item => ({
      ...item,
      price: Math.round(item.price),
    }));

    const calculatedGrossAmount = Math.round(calculateItemsSum(normalizedItems));

    // Prepare the request payload
    const payload = {
      payment_type: "qris",
      transaction_details: {
        order_id: transaction_id,
        gross_amount: calculatedGrossAmount,
      },
      item_details: normalizedItems,
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
        Authorization: `Basic ${getAuthHeader()}`,
      },
      data: payload,
    });

    console.log("Midtrans response:", JSON.stringify(response.data, null, 2));

    // Check for successful response
    if (response.status === 200 && response.data) {
      // Find the QR code URL from actions
      // The action name might vary, so try multiple possibilities
      let qrisUrl = null;

      if (response.data.actions && Array.isArray(response.data.actions)) {
        // Try to find the QR code URL by checking different action names
        const qrisAction = response.data.actions.find(
          (action) => action.name === "generate-qr-code" ||
                      action.name === "qr-code" ||
                      action.name === "qris" ||
                      action.url?.includes("qr")
        );

        if (qrisAction) {
          qrisUrl = qrisAction.url;
          console.log("Found QRIS URL:", qrisUrl);
        } else {
          console.log("Actions available:", response.data.actions.map(a => a.name));
        }
      }

      const result = {
        qris_url: qrisUrl,
        qris_id: response.data.transaction_id,
        order_id: response.data.order_id,
        status: response.data.transaction_status,
        merchant_id: response.data.merchant_id,
        gross_amount: response.data.gross_amount,
        expiry_time: new Date(Date.now() + expiry_duration * 60000),
        actions: response.data.actions,
        qr_string: response.data.qr_string, // QR code string for frontend rendering
      };

      console.log("Returning result:", result);

      return result;
    } else {
      throw new Error("Failed to generate QRIS code");
    }
  } catch (error) {
    console.error(
      "Midtrans QRIS error:",
      error.response ? error.response.data : error.message
    );

    // Handle 406/409 conflict errors - the order might already exist
    if (error.response?.status === 406 || error.response?.status === 409) {
      const orderId = params.transaction_id;
      console.log("Order might already exist, checking status for:", orderId);

      try {
        // Try to get the status of the existing order
        const statusData = await getTransactionStatus(orderId);

        if (statusData && statusData.actions) {
          // Find the QR code URL from the existing order
          let qrisUrl = null;

          if (Array.isArray(statusData.actions)) {
            const qrisAction = statusData.actions.find(
              (action) => action.name === "generate-qr-code" ||
                          action.name === "qr-code" ||
                          action.name === "qris" ||
                          action.url?.includes("qr")
            );

            if (qrisAction) {
              qrisUrl = qrisAction.url;
            }
          }

          console.log("Found existing QRIS order:", statusData.order_id);

          // Return the existing order data
          return {
            qris_url: qrisUrl || statusData.qr_string || null,
            qris_id: statusData.transaction_id,
            order_id: statusData.order_id,
            status: statusData.transaction_status,
            merchant_id: statusData.merchant_id,
            gross_amount: statusData.gross_amount,
            expiry_time: statusData.expiry_time ?
              new Date(statusData.expiry_time) :
              new Date(Date.now() + 15 * 60 * 1000),
            actions: statusData.actions,
            qr_string: statusData.qr_string, // QR code string for frontend rendering
            is_existing: true, // Flag to indicate this is an existing order
          };
        }
      } catch (statusError) {
        console.error("Failed to get existing order status:", statusError);
      }

      // If we couldn't get the existing order, throw the original error
      throw new ResponseError(
        error.response?.status || 500,
        "Order already exists but could not retrieve details. Please try again in a few moments."
      );
    }

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
