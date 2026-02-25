import api from "./api";

const ocrService = {
  // Extract data from invoice image
  extractInvoice: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    return api.post("/ocr/extract-invoice", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  mapInvoice: async (ocrData) => {
    return api.post("/ocr/map-invoice", { ocrData });
  },

  saveMapping: async (mappingData) => {
    return api.post("/ocr/save-mapping", mappingData);
  }
};

export default ocrService;
