import React from "react";
import { History, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@common/components/ui/table";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import Spinner from "@features/common/Spinner";
import EmptyState from "@features/common/EmptyState";
import formatCurrency from "@common/utils/formatCurrency";
import { formatDate } from "@common/utils/format";

const SupplierPriceHistoryTab = ({
  priceHistory,
  isLoading,
  selectedBranchId,
  branches,
  onBranchChange,
  pagination,
  onNextPage,
  onPrevPage,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
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
      </div>

      {!priceHistory || priceHistory.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat harga"
          description={`Belum ada perubahan harga yang tercatat untuk supplier ini ${
            selectedBranchId ? "di cabang ini" : ""
          }`}
          icon={<History className="h-10 w-10 text-blue-200" />}
        />
      ) : (
        <div className="rounded-md border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Harga Lama</TableHead>
                <TableHead>Harga Baru</TableHead>
                <TableHead>Selisih</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceHistory.map((history) => {
                const priceDiff = history.hargaBaru - history.hargaLama;
                const isPriceUp = priceDiff > 0;
                
                return (
                  <TableRow key={history.id}>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {formatDate(history.tanggalPerubahan)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(history.tanggalPerubahan).toLocaleTimeString("id-ID", {
                           hour: '2-digit', minute:'2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="font-medium text-gray-900">
                          {history.produkNama || "Produk dihapus"}
                       </div>
                       <div className="text-xs text-gray-500">
                          {history.produkKode || "-"}
                       </div>
                    </TableCell>
                    <TableCell>{formatCurrency(history.hargaLama)}</TableCell>
                    <TableCell>{formatCurrency(history.hargaBaru)}</TableCell>
                    <TableCell>
                      <div className={`flex items-center ${isPriceUp ? 'text-red-600' : 'text-green-600'}`}>
                        {isPriceUp ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                        {formatCurrency(Math.abs(priceDiff))}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {history.alasanPerubahan || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
           {/* Pagination */}
           <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={onPrevPage}
                disabled={!pagination?.prev_page}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={onNextPage}
                disabled={!pagination?.next_page}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Menampilkan halaman <span className="font-medium">{pagination?.current_page}</span> dari <span className="font-medium">{pagination?.total_pages}</span>
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <Button
                    variant="outline"
                    className="rounded-l-md"
                    onClick={onPrevPage}
                    disabled={!pagination?.prev_page}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-r-md"
                    onClick={onNextPage}
                    disabled={!pagination?.next_page}
                  >
                    Selanjutnya
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPriceHistoryTab;
