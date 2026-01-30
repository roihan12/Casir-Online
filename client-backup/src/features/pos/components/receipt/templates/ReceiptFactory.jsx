import React from "react";
import CashReceipt from "./CashReceipt";
import CreditReceipt from "./CreditReceipt";
import QrisReceipt from "./QrisReceipt";
import withPromo from "./PromoDecorator";

/**
 * ReceiptFactory
 * Factory pattern to select appropriate receipt template based on payment method and promo status
 *
 * Expected data structure (from backend API):
 * {
 *   paymentMethod: string,
 *   promo: { hasPromo: boolean, ... },
 *   credit: { isCredit: boolean, ... }
 * }
 */

// Create decorated versions of each receipt type
const CashReceiptWithPromo = withPromo(CashReceipt);
const CreditReceiptWithPromo = withPromo(CreditReceipt);
const QrisReceiptWithPromo = withPromo(QrisReceipt);

/**
 * Determine receipt template type based on transaction data
 * @param {Object} data - Transaction data from backend API
 * @returns {string} - Template type
 */
const determineReceiptTemplate = (data) => {
  const { paymentMethod, promo, credit, templateType } = data;

  // Use backend-provided templateType if available, otherwise determine
  if (templateType) {
    return templateType;
  }

  // Get payment method
  const method = paymentMethod || "TUNAI";

  // Check if has promo
  const hasPromo = promo?.hasPromo ||
                   (promo?.promosApplied && promo.promosApplied.length > 0);

  // Check if credit transaction
  const isCredit = credit?.isCredit ||
                   method === "KREDIT" ||
                   method === "TEMPO" ||
                   method === "KREDIT_PELANGGAN";

  // Determine template
  if (isCredit) {
    return hasPromo ? "credit_with_promo" : "credit";
  }
  if (method === "QRIS") {
    return hasPromo ? "qris_with_promo" : "qris";
  }
  if (method === "TRANSFER" || method === "TRANSFER_BANK") {
    return hasPromo ? "transfer_with_promo" : "transfer";
  }
  // Default: cash payment
  return hasPromo ? "cash_with_promo" : "cash";
};

/**
 * Get the appropriate receipt component based on template type
 * @param {string} templateType - Template type
 * @returns {React.Component} - Receipt component
 */
const getReceiptComponent = (templateType) => {
  switch (templateType) {
    case "credit_with_promo":
      return CreditReceiptWithPromo;
    case "credit":
      return CreditReceipt;
    case "qris_with_promo":
      return QrisReceiptWithPromo;
    case "qris":
      return QrisReceipt;
    case "cash_with_promo":
      return CashReceiptWithPromo;
    case "cash":
    default:
      return CashReceipt;
  }
};

/**
 * ReceiptFactory Component
 * Automatically selects and renders the appropriate receipt template
 */
const ReceiptFactory = ({ data }) => {
  // Determine template type
  const templateType = determineReceiptTemplate(data);

  // Get appropriate component
  const ReceiptComponent = getReceiptComponent(templateType);

  return <ReceiptComponent data={data} />;
};

export default ReceiptFactory;
export { determineReceiptTemplate, getReceiptComponent };
