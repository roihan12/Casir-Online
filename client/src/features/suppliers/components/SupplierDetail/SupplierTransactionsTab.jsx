import React from "react";
import { ShoppingBag, Plus, FileText } from "lucide-react";
import { Button } from "@common/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@common/components/ui/table";
import { Badge } from "@common/components/ui/badge";
import Spinner from "@features/common/Spinner";
import EmptyState from "@features/common/EmptyState";
import { Can } from "@features/common/PermissionGate";
import { useNavigate } from "react-router-dom";
import formatCurrency from "@common/utils/formatCurrency";

const SupplierTransactionsTab = ({
  transactions,
  isLoading,
  selectedBranchId,
  branches,
  onBranchChange,
  supplierId,
}) => {
  const navigate = useNavigate();

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

        <div className="flex flex-wrap gap-2 w-full md:w-auto self-end">
            <h3 className="text-lg font-medium text-gray-800 mr-auto md:mr-4 self-center">
              Total: {transactions?.length || 0} Transaksi
            </h3>
            <Can permission="transaksi:create">
                <Button
                    onClick={() => {
                        navigate(
                        `/suppliers/${supplierId}/purchase/create?preselect=true${
                            selectedBranchId ? `&cabangId=${selectedBranchId}` : ""
                        }`
                        );
                    }}
                    className="flex items-center bg-green-600 hover:bg-green-700"
                >
                    <ShoppingBag size={14} className="mr-1" />
                    Beli dgn Produk
                </Button>
                <Button
                    onClick={() => {
                        navigate(
                        `/purchases/create/${supplierId}${
                            selectedBranchId ? `?cabangId=${selectedBranchId}` : ""
                        }`
                        );
                    }}
                    className="flex items-center"
                >
                    <Plus size={14} className="mr-1" />
                    Buat Pembelian
                </Button>
            </Can>
        </div>
      </div>

      {!transactions || transactions.length === 0 ? (
        <EmptyState
            title="Belum ada transaksi"
            description={`Belum ada transaksi yang tercatat dengan supplier ini ${selectedBranchId ? "di cabang ini" : ""}`}
            icon={<FileText className="h-10 w-10 text-blue-200" />}
          />
      ) : (
        <div className="rounded-md border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Transaksi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status Pembayaran</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium text-indigo-600">
                    {transaction.nomor_transaksi}
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                         {transaction.jenis_transaksi}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(transaction.total)}
                  </TableCell>
                  <TableCell>
                    <Badge
                        variant={transaction.status_pembayaran === "lunas" ? "success" : "warning"}
                    >
                         {transaction.status_pembayaran}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            navigate(`/transactions/${transaction.transaksi_id}`)
                        }
                    >
                        Detail
                    </Button>
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

export default SupplierTransactionsTab;
