import api from "@common/utils/api";

const importProdukMasterService = {
  /**
   * Download template Excel untuk import ProdukMaster
   */
  async downloadTemplate() {
    const response = await api.get("/import/produk-master/template", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `template_produk_master_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Preview import (dry-run) — tidak menyimpan ke DB
   * @param {File} file
   */
  async previewImport(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/import/produk-master/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  /**
   * Eksekusi import ProdukMaster
   * @param {File} file
   */
  async importProdukMaster(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/import/produk-master", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};

export default importProdukMasterService;
