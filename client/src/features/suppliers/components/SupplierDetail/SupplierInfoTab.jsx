import React from "react";
import {
  Phone,
  AtSign,
  MapPin,
  User,
  Package,
  FileText,
  DollarSign,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@common/components/ui/card";
import formatCurrency from "@common/utils/formatCurrency";

const SupplierInfoTab = ({ supplier, branches }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
      <div className="space-y-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <span className="block text-sm font-medium text-gray-500">
                  Telepon
                </span>
                <span className="block mt-1 text-gray-900">
                  {supplier.telepon || "-"}
                </span>
              </div>
            </div>

            <div className="flex items-start">
              <AtSign className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <span className="block text-sm font-medium text-gray-500">
                  Email
                </span>
                <span className="block mt-1 text-gray-900">
                  {supplier.email || "-"}
                </span>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <span className="block text-sm font-medium text-gray-500">
                  Alamat
                </span>
                <span className="block mt-1 text-gray-900">
                  {supplier.alamat || "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PIC Info */}
        <Card>
          <CardHeader>
            <CardTitle>Person In Charge (PIC)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <span className="block text-sm font-medium text-gray-500">
                  Nama PIC
                </span>
                <span className="block mt-1 text-gray-900">
                  {supplier.picNama || "-"}
                </span>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <span className="block text-sm font-medium text-gray-500">
                  Kontak PIC
                </span>
                <span className="block mt-1 text-gray-900">
                  {supplier.picKontak || "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Stats */}
        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-900">Statistik Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-1">
                    <Package className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-500">
                    Total Produk
                    </span>
                </div>
                <span className="block text-2xl font-semibold text-gray-900">
                  {supplier?.stats?.totalProduk || 0}
                </span>
              </div>

              <div>
                <div className="flex items-center mb-1">
                    <FileText className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-500">
                    Total Transaksi
                    </span>
                </div>
                <span className="block text-2xl font-semibold text-gray-900">
                  {supplier?.stats?.totalTransaksi || 0}
                </span>
              </div>

              <div>
                <div className="flex items-center mb-1">
                    <DollarSign className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-500">
                    Nilai Transaksi
                    </span>
                </div>
                <span className="block text-2xl font-semibold text-blue-600">
                  {formatCurrency(supplier.stats?.nilaiTransaksi || 0)}
                </span>
              </div>

              <div>
                <div className="flex items-center mb-1">
                    <Calendar className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-500">
                    Tanggal Daftar
                    </span>
                </div>
                <span className="block text-md font-medium text-gray-900 mt-1">
                  {supplier.createdAt
                    ? new Date(supplier.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Branches */}
        <Card>
          <CardHeader>
            <CardTitle>Cabang Terkait</CardTitle>
          </CardHeader>
          <CardContent>
            {branches && branches.length > 0 ? (
              <div className="space-y-3">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                  >
                    <span className="font-medium text-gray-900 block">
                      {branch.namaCabang || "Cabang"}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {branch.alamat || "Alamat cabang"}
                    </p>
                  </div>
                ))}
              </div>
            ) : supplier.cabang_id ? (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <span className="font-medium text-indigo-900 block">
                  {supplier.cabang?.namaCabang || "Cabang"}
                </span>
                <p className="text-sm text-indigo-700 mt-1">
                  Supplier ini terkait dengan cabang spesifik
                </p>
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <span className="font-medium text-green-900 block">Semua Cabang</span>
                <p className="text-sm text-green-700 mt-1">
                  Supplier ini tersedia untuk semua cabang
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierInfoTab;
