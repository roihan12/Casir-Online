import React from "react";
import { Search, Package, ArrowUpDown, Plus, Edit } from "lucide-react";
import { Button } from "@common/components/ui/button";
import { Badge } from "@common/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@common/components/ui/table";
import Spinner from "@features/common/Spinner";
import EmptyState from "@features/common/EmptyState";
import { Can } from "@features/common/PermissionGate";
import { useNavigate } from "react-router-dom";

const SupplierProductsTab = ({
  products,
  isLoading,
  error,
  selectedBranchId,
  branches,
  onBranchChange,
  productSearch,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortConfig,
  onSort,
  supplierId,
  supplierName
}) => {
  const navigate = useNavigate();

  

  // Filter and sort products
  const filteredAndSortedProducts = React.useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Apply search filter
    if (productSearch) {
      filtered = filtered.filter((product) => {
        const productName =
          product.produkMaster?.namaProduk?.toLowerCase() || "";
        const productCode = product.kodeProdukSupplier?.toLowerCase() || "";
        const searchLower = productSearch.toLowerCase();
        return (
          productName.includes(searchLower) || productCode.includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.field) {
        case "namaProduk":
          aValue = a.produkMaster?.namaProduk || "";
          bValue = b.produkMaster?.namaProduk || "";
          break;
        case "hargaBeli":
          aValue = a.hargaBeli || 0;
          bValue = b.hargaBeli || 0;
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, productSearch, statusFilter, sortConfig]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center justify-between">
        <span>Gagal memuat produk: {error.message}</span>
        <Button
            variant="outline"
            className="text-red-700 border-red-200 hover:bg-red-100"
            onClick={() => window.location.reload()}
        >
            Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Cabang
            </label>
            <select
              value={selectedBranchId || ""}
              onChange={(e) => onBranchChange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {branches && branches.length > 0 ? (
                <>
                  <option value="" disabled>
                    Pilih Cabang
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.namaCabang}
                    </option>
                  ))}
                </>
              ) : (
                <option value="">Semua Cabang</option>
              )}
            </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto self-end">
            <h3 className="text-lg font-medium text-gray-800 mr-auto md:mr-4">
              Total: {filteredAndSortedProducts.length} Produk
            </h3>
            <Can permission="produk:create">
                <Button
                    onClick={() =>
                    navigate(
                        `/suppliers/${supplierId}/products/create${
                        selectedBranchId ? `?cabangId=${selectedBranchId}` : ""
                        }`
                    )
                    }
                    className="flex items-center"
                >
                    <Plus size={16} className="mr-1" />
                    Tambah Produk
                </Button>
            </Can>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari produk atau kode..."
            value={productSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[150px]"
        >
          <option value="all">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {!products || products.length === 0 ? (
        <EmptyState
          title="Belum ada produk"
          description={`Supplier ini belum memiliki produk yang terhubung ${selectedBranchId ? "di cabang ini" : ""}`}
          icon={<Package className="h-10 w-10 text-blue-200" />}
        />
      ) : filteredAndSortedProducts.length === 0 ? (
        <EmptyState
            title="Tidak ada hasil"
            description="Tidak ada produk yang sesuai dengan filter Anda"
            icon={<Search className="h-10 w-10 text-blue-200" />}
        />
      ) : (
        <div className="rounded-md border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => onSort("namaProduk")}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Produk</span>
                    {sortConfig.field === "namaProduk" && (
                      <ArrowUpDown size={14} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Kode Produk</TableHead>
                <TableHead
                  onClick={() => onSort("hargaBeli")}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Harga Beli</span>
                    {sortConfig.field === "hargaBeli" && (
                      <ArrowUpDown size={14} />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => onSort("status")}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortConfig.field === "status" && (
                      <ArrowUpDown size={14} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.produkMaster?.namaProduk || "Produk"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.produkMaster?.kategori?.namaKategori ||
                            "Kategori"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.kodeProdukSupplier || "-"}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(product.hargaBeli)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                         <Badge
                            variant={product.status === "aktif" ? "success" : "destructive"}
                         >
                            {product.status === "aktif" ? "Aktif" : "Nonaktif"}
                         </Badge>
                         {product.isPrimary && (
                            <Badge variant="default">Utama</Badge>
                         )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                         <Button
                            variant="ghost"
                            size="sm"
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() =>
                                navigate(`/products/${product.produkMasterId}`)
                            }
                         >
                            Lihat
                         </Button>
                        <Can permission="produk:update">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() =>
                                    navigate(
                                    `/suppliers/${supplierId}/products/${product.id}/edit`
                                    )
                                }
                            >
                                <Edit size={14} className="mr-1" />
                                Edit
                            </Button>
                        </Can>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SupplierProductsTab;
