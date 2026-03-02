const prisma = require("../config/db");
const wa = require("./whatsappService");

/**
 * Format phone number to international format (628xxx)
 */
const formatPhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
};

/**
 * Format currency to Rupiah
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get bot config for a branch (to get deviceId)
 */
const getBotConfig = async (cabangId) => {
  try {
    const config = await prisma.botConfig.findFirst({
      where: {
        cabangId,
        isActive: true,
        platformType: "WHATSAPP",
      },
    });
    return config;
  } catch (err) {
    console.warn("Failed to get bot config:", err.message);
    return null;
  }
};

/**
 * Send order confirmation to CUSTOMER after checkout
 */
const sendOrderConfirmation = async (orderData, cabangInfo) => {
  try {
    const phone = formatPhone(orderData.customer?.phone);
    if (!phone) return;

    const botConfig = await getBotConfig(orderData.cabang_id || cabangInfo?.id);
    const deviceId = botConfig?.deviceId || null;

    const trackingUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/catalog/${orderData.cabang_id || cabangInfo?.id}/order/${orderData.transaksi_id}`;

    const itemsList = (orderData.items || [])
      .map((item, i) => `  ${i + 1}. ${item.nama_produk} x${item.jumlah} = ${formatCurrency(item.total)}`)
      .join("\n");

    const message = `✅ *Pesanan Berhasil Dibuat!*

Halo *${orderData.customer?.name}* 👋

Berikut detail pesanan Anda:

📋 *No. Pesanan:* ${orderData.nomor_transaksi}
📦 *Tipe:* ${orderData.order_type === "DELIVERY" ? "Delivery" : "Pickup"}
💳 *Pembayaran:* ${orderData.payment_method === "PAYMENT_LINK" ? "Online" : orderData.payment_method === "COD" ? "COD" : "Bayar di Toko"}

🛒 *Daftar Item:*
${itemsList}

💰 *Subtotal:* ${formatCurrency(orderData.subtotal)}${orderData.diskon > 0 ? `\n🏷️ *Diskon:* -${formatCurrency(orderData.diskon)}` : ""}${orderData.delivery_fee > 0 ? `\n🚚 *Ongkir:* ${formatCurrency(orderData.delivery_fee)}` : ""}
💵 *Total:* ${formatCurrency(orderData.total)}

📍 *Lacak Pesanan:*
${trackingUrl}${orderData.payment_url ? `\n\n💳 *Link Pembayaran:*\n${orderData.payment_url}` : ""}

Terima kasih telah berbelanja! 🙏`;

    await wa.sendMessage(phone, message, deviceId);
    console.log(`[WA] Order confirmation sent to ${phone}`);
  } catch (err) {
    // Don't block checkout if WA fails
    console.error("[WA] Failed to send order confirmation:", err.message);
  }
};

/**
 * Send notification to ADMIN/STORE when new order comes in
 */
const sendOrderNotificationToAdmin = async (orderData, cabangInfo) => {
  try {
    const botConfig = await getBotConfig(orderData.cabang_id || cabangInfo?.id);
    if (!botConfig?.phoneNumber) return;

    const adminPhone = formatPhone(botConfig.phoneNumber);
    const deviceId = botConfig?.deviceId || null;

    const itemsList = (orderData.items || [])
      .map((item, i) => `  ${i + 1}. ${item.nama_produk} x${item.jumlah}`)
      .join("\n");

    const message = `🔔 *Pesanan Baru Masuk!*

📋 *No. Pesanan:* ${orderData.nomor_transaksi}
👤 *Customer:* ${orderData.customer?.name}
📱 *Telepon:* ${orderData.customer?.phone}
📦 *Tipe:* ${orderData.order_type === "DELIVERY" ? "Delivery" : "Pickup"}${orderData.customer?.address ? `\n📍 *Alamat:* ${orderData.customer.address}` : ""}

🛒 *Item:*
${itemsList}

💵 *Total:* ${formatCurrency(orderData.total)}
💳 *Pembayaran:* ${orderData.payment_method === "PAYMENT_LINK" ? "Online (Menunggu)" : orderData.payment_method === "COD" ? "COD" : "Bayar di Toko"}

Segera proses pesanan ini! 🚀`;

    await wa.sendMessage(adminPhone, message, deviceId);
    console.log(`[WA] Admin notification sent to ${adminPhone}`);
  } catch (err) {
    console.error("[WA] Failed to send admin notification:", err.message);
  }
};

/**
 * Send payment success notification to CUSTOMER
 */
const sendPaymentSuccessNotification = async (transaksiId) => {
  try {
    const transaksi = await prisma.transaksi.findUnique({
      where: { transaksi_id: transaksiId },
      include: {
        pelanggan: true,
      },
    });

    if (!transaksi) return;

    const phone = formatPhone(transaksi.customer_phone);
    if (!phone) return;

    const botConfig = await getBotConfig(transaksi.cabang_id);
    const deviceId = botConfig?.deviceId || null;

    const trackingUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/catalog/${transaksi.cabang_id}/order/${transaksiId}`;

    const message = `💰 *Pembayaran Berhasil!*

Halo *${transaksi.customer_name}* 👋

Pembayaran untuk pesanan *${transaksi.nomor_transaksi}* telah berhasil dikonfirmasi!

💵 *Total Dibayar:* ${formatCurrency(Number(transaksi.total))}
📦 *Status:* Pesanan sedang diproses

📍 *Lacak Pesanan:*
${trackingUrl}

Terima kasih! 🙏`;

    await wa.sendMessage(phone, message, deviceId);
    console.log(`[WA] Payment success notification sent to ${phone}`);
  } catch (err) {
    console.error("[WA] Failed to send payment success notification:", err.message);
  }
};

/**
 * Send order status update to CUSTOMER
 */
const sendOrderStatusUpdate = async (transaksiId, newStatus) => {
  try {
    const transaksi = await prisma.transaksi.findUnique({
      where: { transaksi_id: transaksiId },
    });

    if (!transaksi) return;

    const phone = formatPhone(transaksi.customer_phone);
    if (!phone) return;

    const botConfig = await getBotConfig(transaksi.cabang_id);
    const deviceId = botConfig?.deviceId || null;

    const trackingUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/catalog/${transaksi.cabang_id}/order/${transaksiId}`;

    const statusMessages = {
      CONFIRMED: "✅ Pesanan Anda telah *dikonfirmasi* dan sedang diproses!",
      PROCESSING: "👨‍🍳 Pesanan Anda sedang *diproses*!",
      READY: "📦 Pesanan Anda sudah *siap*! Silakan ambil di toko.",
      ON_DELIVERY: "🚚 Pesanan Anda sedang *dalam pengiriman*!",
      COMPLETED: "🎉 Pesanan Anda telah *selesai*! Terima kasih telah berbelanja.",
      CANCELLED: "❌ Pesanan Anda telah *dibatalkan*.",
    };

    const statusMsg = statusMessages[newStatus] || `Status pesanan: ${newStatus}`;

    const message = `📋 *Update Pesanan*

Halo *${transaksi.customer_name}* 👋

${statusMsg}

📋 *No. Pesanan:* ${transaksi.nomor_transaksi}

📍 *Lacak Pesanan:*
${trackingUrl}`;

    await wa.sendMessage(phone, message, deviceId);
    console.log(`[WA] Status update (${newStatus}) sent to ${phone}`);
  } catch (err) {
    console.error("[WA] Failed to send status update:", err.message);
  }
};

module.exports = {
  sendOrderConfirmation,
  sendOrderNotificationToAdmin,
  sendPaymentSuccessNotification,
  sendOrderStatusUpdate,
};
