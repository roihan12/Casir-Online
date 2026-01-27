import { useCallback } from "react";

export const usePOSReceipt = () => {
  // Print receipt
  const printReceipt = useCallback((receiptContent) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up diblokir. Mohon izinkan pop-up untuk mencetak struk.");
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Struk</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              font-size: 12px;
            }
            .receipt {
              max-width: 300px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
            }
            .store-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .info-line {
              margin: 3px 0;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .items-table {
              margin: 10px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .item-name {
              flex: 1;
            }
            .item-qty {
              text-align: right;
              min-width: 50px;
            }
            .totals {
              margin: 10px 0;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .total-final {
              font-weight: bold;
              font-size: 14px;
              border-top: 2px solid #000;
              padding-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
            }
            .thank-you {
              font-weight: bold;
              margin-bottom: 5px;
              text-transform: uppercase;
              font-size: 10px;
            }
            @media print {
              body {
                padding: 0;
              }
              .receipt {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${receiptContent.innerHTML}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  }, []);

  // Download receipt as PDF (requires html2pdf library)
  const downloadReceiptPDF = useCallback(async (receiptData) => {
    try {
      // Import html2pdf dynamically if available
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("receipt-content");
      
      if (!element) {
        console.error("Receipt content element not found");
        return;
      }

      const opt = {
        margin: 0,
        filename: `struk-${receiptData.transaction?.id?.slice(-8) || new Date().getTime()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: [80, 200], orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Failed to download PDF:", error);
      // Fallback to print if PDF download fails
      const element = document.getElementById("receipt-content");
      if (element) {
        printReceipt(element);
      }
    }
  }, [printReceipt]);

  // Format receipt date
  const formatReceiptDate = useCallback((date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }, []);

  // Format receipt time
  const formatReceiptTime = useCallback((date) => {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }, []);

  return {
    printReceipt,
    downloadReceiptPDF,
    formatReceiptDate,
    formatReceiptTime,
  };
};