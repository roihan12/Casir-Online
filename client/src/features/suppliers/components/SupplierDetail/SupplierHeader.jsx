import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  Package,
  DollarSign,
  Truck,
} from "lucide-react";
import { Button } from "@common/components/ui/button";
import { Badge } from "@common/components/ui/badge";
import { Can } from "@features/common/PermissionGate";

const SupplierHeader = ({ 
  supplier, 
  onNavigateToProducts, 
  onNavigateToDebt, 
  onStatusChange, 
  onDelete,
  onEdit 
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => navigate("/suppliers")}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Kembali ke Daftar Supplier</span>
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{supplier.namaSupplier}</h1>
            <Badge 
              variant={supplier.status === "aktif" ? "success" : "destructive"}
              className="px-2 py-0.5"
            >
              {supplier.status === "aktif" ? "Aktif" : "Nonaktif"}
            </Badge>
            {supplier.npwp && (
              <Badge variant="outline" className="text-gray-500">
                NPWP: {supplier.npwp}
              </Badge>
            )}
            {supplier.cabang && (
               <div className="flex items-center text-sm text-gray-500 ml-2">
                <Truck size={14} className="mr-1" />
                <span>{supplier.cabang?.namaCabang || "Semua Cabang"}</span>
               </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Can permission="supplier:update">
                <Button 
                variant="outline" 
                size="sm"
                onClick={onEdit}
                className="flex items-center"
                >
                <Edit size={14} className="mr-1" />
                Edit
                </Button>
            </Can>

            <Button 
              variant="default" 
              size="sm"
              onClick={onNavigateToProducts}
              className="flex items-center bg-blue-600 hover:bg-blue-700"
            >
              <Package size={14} className="mr-1" />
              Produk
            </Button>

            <Button 
              variant="default" 
              size="sm"
              onClick={onNavigateToDebt}
              className="flex items-center bg-orange-500 hover:bg-orange-600"
            >
              <DollarSign size={14} className="mr-1" />
              Hutang
            </Button>
            
            <Can permission="supplier:update">
                {supplier.status === "aktif" ? (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onStatusChange("nonaktif")}
                    className="flex items-center bg-orange-500 hover:bg-orange-600 border-none"
                >
                    <UserX size={14} className="mr-1" />
                    Nonaktifkan
                </Button>
                ) : (
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => onStatusChange("aktif")}
                    className="flex items-center bg-green-600 hover:bg-green-700"
                >
                    <UserCheck size={14} className="mr-1" />
                    Aktifkan
                </Button>
                )}
            </Can>

            <Can permission="supplier:delete">
                <Button 
                variant="destructive" 
                size="sm"
                onClick={onDelete}
                className="flex items-center"
                >
                <Trash2 size={14} className="mr-1" />
                Hapus
                </Button>
            </Can>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierHeader;
