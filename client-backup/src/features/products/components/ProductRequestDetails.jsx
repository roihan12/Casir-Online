import React from "react";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";

const ProductRequestDetails = ({ request, branchList, userList, onClose }) => {
  const getBranchName = (id) => {
    const branch = branchList.find(b => b.id === id);
    return branch ? (branch.namaCabang || branch.name) : "Unknown";
  };

  const getUserName = (id) => {
    const user = userList.find(u => u.id === id);
    return user ? `${user.namaLengkap || user.username}` : "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">ID: {request.id.substring(0, 8)}</h3>
          <p className="text-sm text-gray-500">Dibuat pada {new Date(request.createdAt).toLocaleDateString()}</p>
        </div>
        <Badge variant={request.status === "approved" ? "success" : "secondary"}>
          {request.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Requester</h4>
          <p className="text-sm font-medium">{getUserName(request.requestById)}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cabang</h4>
          <p className="text-sm font-medium">{getBranchName(request.cabangId)}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipe</h4>
          <p className="text-sm font-medium">{request.requestType === "restock" ? "Restock Produk" : "Produk Baru"}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prioritas</h4>
          <p className="text-sm font-medium capitalize">{request.prioritas}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold border-b pb-2">Item Request</h4>
        <div className="space-y-2">
          {request.items && request.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
              <div>
                <p className="font-medium">{item.namaProduk || "Restock Item"}</p>
                {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{item.jumlahDiminta} Unit</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onClose}>Tutup</Button>
      </div>
    </div>
  );
};

export default ProductRequestDetails;
