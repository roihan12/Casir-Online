import api from "@common/utils/api";

const importProdukService = {
  /**
   * Download template Excel untuk import Produk
   */
  async downloadTemplate() {
    const response = await api.get("/import/produk/template", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `template_produk_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Preview import Produk (dry-run) untuk satu cabang
   * @param {File} file
   * @param {string} cabangId
   */
  async previewImport(file, cabangId) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cabangId", cabangId);
    const response = await api.post("/import/produk/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  /**
   * Eksekusi import Produk ke satu cabang
   * @param {File} file
   * @param {string} cabangId
   */
  async importProduk(file, cabangId) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cabangId", cabangId);
    const response = await api.post("/import/produk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};

export default importProdukService;
