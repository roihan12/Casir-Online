import React from "react";
import { useParams, Link } from "react-router-dom";
import { useSupplierDetail } from "../../hooks/useSupplierDetail";
import { formatCurrency } from "../../utils/formatters";

const SupplierDetail = () => {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useSupplierDetail(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error: {error?.message || "Failed to load supplier details"}
      </div>
    );
  }

  const supplier = data?.data;
  if (!supplier) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="bg-indigo-600 p-4 rounded-t-lg text-white flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/suppliers" className="mr-4 hover:text-indigo-200">
            &larr; Kembali ke Daftar Supplier
          </Link>
          {supplier.status === "nonaktif" && (
            <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-semibold">
              Nonaktif
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white text-indigo-600 rounded hover:bg-indigo-50">
            <i className="fas fa-edit mr-2"></i> Edit
          </button>
          <button className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-400">
            <i className="fas fa-box mr-2"></i> Produk
          </button>
          <button className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-400">
            <i className="fas fa-money-bill mr-2"></i> Hutang
          </button>
          {supplier.status === "nonaktif" ? (
            <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-400">
              <i className="fas fa-check mr-2"></i> Aktifkan
            </button>
          ) : (
            <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-400">
              <i className="fas fa-ban mr-2"></i> Nonaktifkan
            </button>
          )}
          <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400">
            <i className="fas fa-trash mr-2"></i> Hapus
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <a
            href="#"
            className="border-b-2 border-indigo-500 py-4 px-6 text-indigo-600 font-medium"
          >
            Informasi Supplier
          </a>
          <a
            href="#"
            className="border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 font-medium"
          >
            Produk
          </a>
          <a
            href="#"
            className="border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 font-medium"
          >
            Hutang
          </a>
          <a
            href="#"
            className="border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 font-medium"
          >
            Transaksi
          </a>
          <a
            href="#"
            className="border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 font-medium"
          >
            Riwayat Harga
          </a>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Informasi Kontak</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="text-gray-500 w-24">
                <i className="fas fa-phone-alt mr-2"></i> Telepon
              </div>
              <div>{supplier.telepon || "-"}</div>
            </div>
            <div className="flex items-start">
              <div className="text-gray-500 w-24">
                <i className="fas fa-envelope mr-2"></i> Email
              </div>
              <div>{supplier.email || "-"}</div>
            </div>
            <div className="flex items-start">
              <div className="text-gray-500 w-24">
                <i className="fas fa-map-marker-alt mr-2"></i> Alamat
              </div>
              <div>{supplier.alamat || "-"}</div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">
            Person In Charge (PIC)
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="text-gray-500 w-24">
                <i className="fas fa-user mr-2"></i> Nama PIC
              </div>
              <div>{supplier.picNama || "-"}</div>
            </div>
            <div className="flex items-start">
              <div className="text-gray-500 w-24">
                <i className="fas fa-phone-alt mr-2"></i> Kontak PIC
              </div>
              <div>{supplier.picKontak || "-"}</div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Informasi Supplier</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-gray-500 text-sm">Total Produk</div>
              <div className="text-2xl font-bold">
                {supplier.stats?.totalProduk || 0}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-gray-500 text-sm">Total Transaksi</div>
              <div className="text-2xl font-bold">
                {supplier.stats?.totalTransaksi || 0}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-gray-500 text-sm">Nilai Transaksi</div>
              <div className="text-2xl font-bold">
                {formatCurrency(supplier.stats?.nilaiTransaksi || 0)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-gray-500 text-sm">Tanggal Daftar</div>
              <div className="text-lg font-medium">
                {supplier.createdAt
                  ? new Date(supplier.createdAt).toLocaleDateString("id-ID")
                  : "-"}
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Cabang Terkait</h2>
          {supplier.relatedBranches && supplier.relatedBranches.length > 0 ? (
            supplier.relatedBranches.length === 1 ? (
              <div>
                <div className="font-medium">
                  {supplier.relatedBranches[0].namaCabang}
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium mb-1">Semua Cabang</div>
                <div className="text-gray-500 text-sm">
                  Supplier ini tersedia untuk semua cabang
                </div>
              </div>
            )
          ) : (
            <div className="text-gray-500">Tidak ada cabang terkait</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
