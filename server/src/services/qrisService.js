const midtransService = require("./midtransService");
const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

// Generate QRIS code
const generateQrisCode = async (data) => {
  const {
    amount,
    external_id,
    description,
    customer_name,
    store_name,
    customer_email,
    customer_phone,
    order_items,
  } = data;

  // Format order items for Midtrans
  const formattedItems = order_items || [];

  console.log(formattedItems);

  // Call Midtrans service to generate QRIS
  const qrisData = await midtransService.generateQRIS({
    transaction_id: external_id,
    gross_amount: amount,
    customer_name,
    customer_email,
    customer_phone,
    order_items: formattedItems,
    store_name,
  });

  // Log the QRIS generation
  console.log(
    `QRIS generated for transaction ${external_id} with amount ${amount}`
  );

  // Return the QRIS data
  return {
    reference_id: qrisData.order_id,
    external_id,
    amount,
    description,
    customer_name,
    store_name,
    qris_code: qrisData.qris_id,
    qris_url: qrisData.qris_url,
    qr_string: qrisData.qr_string, // QR code string for frontend rendering
    expiry_time: qrisData.expiry_time,
  };
};

// Check QRIS payment status
const checkQrisStatus = async (reference_id) => {
  try {
    // Call Midtrans service to check status
    const statusData = await midtransService.getTransactionStatus(reference_id);

    // Map Midtrans status to our system status
    let status = "PENDING";
    if (
      statusData.transaction_status === "settlement" ||
      statusData.transaction_status === "capture"
    ) {
      status = "SUKSES";
    } else if (
      statusData.transaction_status === "cancel" ||
      statusData.transaction_status === "deny" ||
      statusData.transaction_status === "expire"
    ) {
      status = "GAGAL";
    }

    return {
      reference_id,
      status,
      payment_time: statusData.settlement_time
        ? new Date(statusData.settlement_time)
        : null,
      transaction_status: statusData.transaction_status,
      payment_type: statusData.payment_type,
      amount: statusData.gross_amount,
    };
  } catch (error) {
    console.error("Error checking QRIS status:", error);
    throw new ResponseError(500, "Failed to check QRIS payment status");
  }
};

// Handle QRIS callback from Midtrans
const handleQrisCallback = async (notificationData) => {
  try {
    // Process the notification with Midtrans service
    const paymentData = await midtransService.handleNotification(
      notificationData
    );

    // Find the payment in our database
    const pembayaran = await prisma.pembayaran.findFirst({
      where: {
        nomor_referensi: paymentData.order_id,
      },
      include: {
        transaksi: true,
      },
    });

    if (!pembayaran) {
      throw new ResponseError(404, "Payment not found");
    }

    // Update payment status in our database
    const updatedPayment = await prisma.pembayaran.update({
      where: { pembayaran_id: pembayaran.pembayaran_id },
      data: {
        status: paymentData.status,
        keterangan: pembayaran.keterangan
          ? `${pembayaran.keterangan} | Updated by Midtrans callback: ${paymentData.status}`
          : `Updated by Midtrans callback: ${paymentData.status}`,
      },
    });

    // If payment is successful, check if transaction should be marked as paid
    if (paymentData.status === "SUKSES") {
      // Calculate total payments for this transaction
      const allPayments = await prisma.pembayaran.findMany({
        where: {
          transaksi_id: pembayaran.transaksi_id,
          status: "SUKSES",
        },
      });

      const totalPaid = allPayments.reduce((sum, payment) => {
        return (
          sum + Number(payment.jumlah_bayar) - Number(payment.jumlah_kembali)
        );
      }, 0);

      // Update transaction status if fully paid
      if (totalPaid >= Number(pembayaran.transaksi.total)) {
        await prisma.transaksi.update({
          where: { transaksi_id: pembayaran.transaksi_id },
          data: {
            status_pembayaran: "LUNAS",
          },
        });
      }
    }

    // Add audit log - use the user who created the payment, or skip if not available
    if (pembayaran.created_by_user_Id) {
      await prisma.auditLog.create({
        data: {
          user_id: pembayaran.created_by_user_Id,
          ip_address: "0.0.0.0",
          action: "MIDTRANS_CALLBACK",
          table_name: "pembayaran",
          record_id: pembayaran.pembayaran_id,
          old_values: JSON.stringify({ status: pembayaran.status }),
          new_values: JSON.stringify({
            status: paymentData.status,
            midtrans_data: paymentData,
          }),
        },
      });
    }

    return {
      success: true,
      pembayaran: updatedPayment,
      payment_status: paymentData.status,
    };
  } catch (error) {
    console.error("Error processing QRIS callback:", error);
    throw new ResponseError(500, "Failed to process QRIS callback");
  }
};

// Cancel QRIS payment
const cancelQrisPayment = async (reference_id) => {
  try {
    // Call Midtrans service to cancel
    const cancelData = await midtransService.cancelTransaction(reference_id);

    // Find and update the payment in our database
    const pembayaran = await prisma.pembayaran.findFirst({
      where: {
        nomor_referensi: reference_id,
      },
    });

    if (!pembayaran) {
      throw new ResponseError(404, "Payment not found");
    }

    // Update payment status
    const updatedPayment = await prisma.pembayaran.update({
      where: { pembayaran_id: pembayaran.pembayaran_id },
      data: {
        status: "GAGAL",
        keterangan: pembayaran.keterangan
          ? `${pembayaran.keterangan} | Canceled manually`
          : `Canceled manually`,
      },
    });

    return {
      success: true,
      pembayaran: updatedPayment,
      midtrans_response: cancelData,
    };
  } catch (error) {
    console.error("Error canceling QRIS payment:", error);
    throw new ResponseError(500, "Failed to cancel QRIS payment");
  }
};

module.exports = {
  generateQrisCode,
  checkQrisStatus,
  handleQrisCallback,
  cancelQrisPayment,
};
