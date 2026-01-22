import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  Tag,
  Hash,
  Truck,
  Calendar,
  Box,
  Clipboard,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Layers,
  Star,
  DollarSign,
  ShoppingCart,
  BarChart2,
} from "lucide-react";
import {
  useProdukMasterDetail,
  useDeleteProdukMaster,
} from "../../../hooks/useProdukMasterQueries";
import { toast } from "react-hot-toast";
import Spinner from "../../../features/common/Spinner";
import Alert from "../../../features/common/Alert";

const ProductMasterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("product");

  // Fetch product details
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useProdukMasterDetail(id);

  console.log("product master detail", product);
  // Delete mutation
  const deleteMutation = useDeleteProdukMaster();

  // Handle edit product
  const handleEdit = () => {
    navigate(`/superadmin/product-master/edit/${id}`);
  };

  // Handle delete product
  const handleDelete = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Produk berhasil dihapus");
        navigate("/superadmin/product-master");
      } catch (error) {
        toast.error(`Gagal menghapus produk: ${error.message}`);
      }
    }
  };

  // Handle go back
  const handleBack = () => {
    navigate("/superadmin/product-master");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4">
        <Alert
          type="error"
          title="Error"
          message={`Gagal memuat data produk: ${error.message}`}
        />
        <div className="mt-4 flex space-x-4">
          <button
            onClick={refetch}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="h-4 w-4" /> Coba lagi
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
        </div>
      </div>
    );
  }

  // If product not found
  if (!product) {
    return (
      <div className="p-4">
        <Alert
          type="warning"
          title="Produk tidak ditemukan"
          message="Produk yang Anda cari tidak ditemukan atau telah dihapus"
        />
        <button
          onClick={handleBack}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Produk
        </button>
      </div>
    );
  }

  // Primary image or placeholder
  const primaryImage =
    product.produkImage && product.produkImage.length > 0
      ? product.produkImage.find((img) => img.isPrimary)?.filePath ||
        product.produkImage[0].filePath
      : "https://via.placeholder.com/500x500?text=No+Image";

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            Product Page
          </h1>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Product Image Gallery */}
          <div>
            <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 aspect-square flex items-center justify-center">
              {product.produkImage && product.produkImage.length > 0 ? (
                <img
                  src={
                    product.produkImage[selectedImage]?.filePath || primaryImage
                  }
                  alt={product.namaProduk}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Tidak ada gambar produk</p>
                </div>
              )}
            </div>

            {/* Image thumbnails */}
            {product.produkImage && product.produkImage.length > 0 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {product.produkImage.map((image, index) => (
                  <div
                    key={image.id}
                    className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                      selectedImage === index
                        ? "border-teal-500"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <div className="w-20 h-20">
                      <img
                        src={image.filePath}
                        alt={`${product.namaProduk} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column - Product Details */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {product.namaProduk}
            </h2>
            <p className="text-gray-500 mb-4">PRODUCT ID: {product.id}</p>

            {/* Short Description */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                PRODUCT SHORT DESCRIPTION
              </h3>
              <p className="text-gray-700">
                {product.deskripsi || "Tidak ada deskripsi produk."}
              </p>
            </div>

            {/* Product Status */}
            <div className="mb-6">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  product.status === "aktif"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.status === "aktif" ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                {product.status === "aktif" ? "Aktif" : "Nonaktif"}
              </span>

              {product.kategori && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Tag className="h-4 w-4 mr-1" />
                  {product.kategori.namaKategori}
                </span>
              )}
            </div>

            {/* Product Description */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                PRODUCT DESCRIPTION
              </h3>
              <p className="text-gray-700 whitespace-pre-line">
                {product.deskripsi || "Tidak ada deskripsi produk."}
              </p>
            </div>

            {/* Additional Information Tabs */}
            <div className="mb-4">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                  <button
                    onClick={() => setActiveTab("product")}
                    className={`py-2 px-1 inline-flex items-center border-b-2 text-sm font-medium ${
                      activeTab === "product"
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    PRODUCT
                  </button>
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-2 px-1 inline-flex items-center border-b-2 text-sm font-medium ${
                      activeTab === "details"
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    ITEM DETAILS
                  </button>
                  <button
                    onClick={() => setActiveTab("composition")}
                    className={`py-2 px-1 inline-flex items-center border-b-2 text-sm font-medium ${
                      activeTab === "composition"
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    COMPOSITION
                  </button>
                </nav>
              </div>

              {/* Tab content */}
              <div className="py-4">
                {activeTab === "product" && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Product</span>
                      <span className="font-medium">{product.namaProduk}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">SKU</span>
                      <span className="font-medium">{product.sku}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Barcode</span>
                      <span className="font-medium">
                        {product.barcode || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Brand</span>
                      <span className="font-medium">
                        {product.brand || "-"}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Satuan</span>
                      <span className="font-medium">
                        {product.satuan || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Berat</span>
                      <span className="font-medium">
                        {product.berat ? `${product.berat} gram` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Dimensi (P x L x T)</span>
                      <span className="font-medium">
                        {product.dimensiP || "-"} x {product.dimensiL || "-"} x{" "}
                        {product.dimensiT || "-"} cm
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === "composition" && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Kelola Stok</span>
                      <span className="font-medium">
                        {product.isManagedStock ? "Ya" : "Tidak"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">
                        Memiliki Tanggal Kadaluarsa
                      </span>
                      <span className="font-medium">
                        {product.hasExpired ? "Ya" : "Tidak"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Informasi Sistem
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Dibuat pada</span>
            <span className="font-medium">
              {new Date(product.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Terakhir diupdate</span>
            <span className="font-medium">
              {new Date(product.updatedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">ID</span>
            <span className="font-medium text-xs bg-gray-100 px-2 py-1 rounded">
              {product.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductMasterDetail;
