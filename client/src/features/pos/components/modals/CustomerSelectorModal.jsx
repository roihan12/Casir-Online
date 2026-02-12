import React, { useState, useEffect } from "react";
import { X, Search, Phone, MapPin, Check, UserPlus, RefreshCw } from "lucide-react";

const CustomerSelectorModal = ({
  show,
  onClose,
  customers = [],
  selectedCustomer,
  onSelectCustomer,
  onCreateNewCustomer,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState(customers);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone?.includes(searchQuery) ||
          customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const handleSelectCustomer = (customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  const handleCreateNewCustomer = () => {
    if (onCreateNewCustomer) {
      onCreateNewCustomer();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Pilih Pelanggan</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Cari pelanggan (nama, no. telp, email, alamat)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg pr-10"
            disabled={loading}
          />
          <Search size={20} className="absolute right-3 top-3.5 text-gray-400" />
        </div>

        {/* Refresh Button */}
        <div className="mb-4 flex justify-end">
          <button
            className="flex items-center space-x-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            onClick={() => {}}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Customers List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.length > 0 ? (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition hover:shadow-md ${
                    selectedCustomer?.id === customer.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {customer.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 text-lg">
                            {customer.name}
                          </h4>
                          {customer.email && (
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="ml-13 space-y-1 text-sm text-gray-600">
                        {customer.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone size={14} className="text-indigo-500" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center space-x-2">
                            <MapPin size={14} className="text-indigo-500" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        )}
                        {customer.city && (
                          <div className="text-gray-500">
                            {customer.city}
                          </div>
                        )}
                      </div>

                      {/* Customer Stats */}
                      {customer.totalPurchases !== undefined && (
                        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                          <span className="font-medium">
                            Total Pembelian: {customer.totalPurchases}
                          </span>
                          {customer.lastPurchaseDate && (
                            <span className="ml-3">
                              Terakhir:{" "}
                              {new Date(customer.lastPurchaseDate).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedCustomer?.id === customer.id && (
                      <Check size={24} className="text-indigo-600 flex-shrink-0 ml-4" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <UserPlus size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">Pelanggan tidak ditemukan</p>
              <p className="text-sm mt-2">
                Coba kata kunci pencarian lainnya atau buat pelanggan baru
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            disabled={loading}
          >
            Batal
          </button>
          {onCreateNewCustomer && (
            <button
              onClick={handleCreateNewCustomer}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
              disabled={loading}
            >
              <UserPlus size={20} />
              <span>Buat Pelanggan Baru</span>
            </button>
          )}
        </div>

        {/* Selected Customer Info */}
        {selectedCustomer && (
          <div className="mt-4 pt-4 border-t bg-indigo-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              Pelanggan yang dipilih:{" "}
              <span className="font-semibold text-indigo-700">
                {selectedCustomer.name}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedCustomer.phone}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSelectorModal;