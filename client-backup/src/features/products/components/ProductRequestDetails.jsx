import React, { useState } from "react";
import { 
  MdCheckCircleOutline, 
  MdHighlightOff, 
  MdAccessTime, 
  MdSend, 
  MdCheck, 
  MdClose, 
  MdSync,
  MdInventory,
  MdDescription,
  MdChatBubbleOutline,
  MdErrorOutline,
  MdInfoOutline
} from "react-icons/md";
import { HiOutlineClock, HiOutlineUser, HiOutlineOfficeBuilding } from "react-icons/hi";
import { Button } from "@common/components/ui/button";
import { useProductRequest,useSubmitProductRequest,useProcessProductRequest,useCompleteProductRequest } from "../hooks/useProductRequest";
import { Textarea } from "@common/components/ui/textarea";
import { Badge } from "@common/components/ui/badge";
import useAuthStore from "@app/store/useAuthStore";

const ProductRequestDetails = ({ requestId, onClose }) => {
  const [catatanProses, setCatatanProses] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user permissions
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canUpdateProduct = hasPermission("produk:update");
  const canManageProduct = hasPermission("produk:manage");

  const { data: request, isLoading } = useProductRequest(requestId);
  
  const submitMutation = useSubmitProductRequest();
  const processMutation = useProcessProductRequest();
  const completeMutation = useCompleteProductRequest();
  

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <MdSync className="h-12 w-12 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Memuat Detail Request...</p>
      </div>
    );
  }

  if (!request) return (
    <div className="p-20 text-center">
      <MdErrorOutline size={48} className="mx-auto text-slate-300 mb-4" />
      <p className="text-slate-500 font-bold">Data request tidak ditemukan</p>
    </div>
  );

  const handleSubmit = async () => {
    await submitMutation.mutateAsync(requestId);
  };

  const handleProcess = async (isApproved) => {
    await processMutation.mutateAsync({ 
      id: requestId, 
      isApproved, 
      catatan: catatanProses 
    });
    setCatatanProses("");
    setIsProcessing(false);
  };

  const handleComplete = async () => {
    await completeMutation.mutateAsync(requestId);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { color: "bg-slate-100 text-slate-700 border-slate-200", label: "Draft" },
      submitted: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Submitted" },
      pending: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending" },
      approved: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Disetujui" },
      rejected: { color: "bg-rose-100 text-rose-700 border-rose-200", label: "Ditolak" },
      partial: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "Sebagian" },
      completed: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Selesai" },
    };

    const config = statusMap[status] || { color: "bg-gray-100 text-gray-700 border-gray-200", label: status };

    return (
      <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${config.color} shadow-sm`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <MdDescription size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <MdDescription size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  #{request.id.substring(0, 8).toUpperCase()}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(request.status)}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                      request.prioritas === 'critical' ? 'bg-rose-600 text-white shadow-sm' : 
                      request.prioritas === 'urgent' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 
                      'bg-emerald-100 text-emerald-600 border border-emerald-200'
                  }`}>
                      {request.prioritas} Priority
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <HiOutlineClock className="text-indigo-400" />
                <span className="text-xs font-bold text-slate-600">
                  {new Date(request.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <HiOutlineOfficeBuilding className="text-indigo-400" />
                <span className="text-xs font-bold text-slate-600">{request.cabang?.namaCabang || 'Cabang Unknown'}</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <HiOutlineUser className="text-indigo-400" />
                <span className="text-xs font-bold text-slate-600">{request.createdByUser?.namaLengkap || 'User Unknown'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <MdInventory size={60} />
            </div>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Total Items Requested</p>
            <p className="text-5xl font-black mb-2">{request.items?.length || 0}</p>
            <p className="text-xs text-indigo-100 font-medium opacity-80">Permintaan stok produk dari cabang ke pusat.</p>
        </div>
      </div>

      {/* Alasan Section */}
      {request.alasan && (
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 relative group">
            <div className="absolute -top-3 left-6 bg-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                Alasan / Keterangan
            </div>
            <p className="text-amber-900 text-sm leading-relaxed font-medium italic">
              <MdChatBubbleOutline className="inline mr-2 opacity-50" />
              "{request.alasan}"
            </p>
        </div>
      )}

      {/* Item List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <MdInventory className="text-indigo-600" size={20} />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Produk</h4>
           </div>
           <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold">
             {request.items?.length} Items
           </Badge>
        </div>
        
        <div className="divide-y divide-slate-50">
          {request.items && request.items.map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors shadow-inner">
                  <MdInventory size={24} />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900">{item.namaProduk || item.produkMaster?.namaProduk || "Produk Unknown"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                      SKU: {item.sku || item.produkMaster?.sku || "-"}
                    </span>
                    {item.produkMasterId && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase tracking-tighter border border-emerald-100">
                        Existing Master
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Estimasi Harga</p>
                  <p className="text-sm font-black text-slate-700">Rp {(item.hargaBeli || 0).toLocaleString()}</p>
                </div>
                <div className="text-right min-w-[100px] bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">Jumlah</p>
                  <p className="text-xl font-black text-indigo-600 leading-none">{item.jumlahDiminta} <span className="text-[10px] uppercase">Unit</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Section - Only for users with manage permission */}
      {request.status === "submitted" && canManageProduct && (
          <div className="mt-8 border-4 border-dashed border-indigo-100 p-8 rounded-[40px] bg-indigo-50/30 transition-all hover:bg-indigo-50/50">
             {!isProcessing ? (
               <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 animate-bounce">
                      <MdInfoOutline size={32} />
                    </div>
                    <div>
                      <h4 className="font-black text-indigo-900 uppercase tracking-widest text-lg">Keputusan Approval</h4>
                      <p className="text-sm text-indigo-700 font-medium">Request ini sedang menunggu tinjauan dan keputusan Anda.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsProcessing(true)} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-12 h-14 font-black shadow-xl shadow-indigo-200 transform active:scale-95 transition-all text-lg"
                  >
                    Mulai Proses
                  </Button>
               </div>
             ) : (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-2">
                    <MdChatBubbleOutline className="text-indigo-600" size={20} />
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Berikan Catatan Review</h4>
                  </div>
                  <Textarea 
                     value={catatanProses} 
                     onChange={(e) => setCatatanProses(e.target.value)}
                     placeholder="Tulis alasan penyetujuan atau penolakan di sini untuk diteruskan ke cabang..."
                     className="rounded-3xl border-2 border-indigo-100 bg-white min-h-[120px] focus:ring-4 focus:ring-indigo-100 transition-all p-5 font-medium"
                  />
                  <div className="flex flex-wrap justify-end gap-4">
                     <Button 
                        variant="ghost" 
                        onClick={() => setIsProcessing(false)} 
                        className="rounded-2xl px-8 h-12 font-bold text-slate-400 hover:text-slate-600 hover:bg-white"
                     >
                       Batal
                     </Button>
                     <Button 
                        onClick={() => handleProcess(false)} 
                        disabled={processMutation.isPending}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-2xl px-10 h-12 font-black flex items-center border border-rose-200 transition-all"
                     >
                        <MdHighlightOff size={22} className="mr-2" /> Tolak Request
                     </Button>
                     <Button 
                        onClick={() => handleProcess(true)} 
                        disabled={processMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-12 h-12 font-black flex items-center shadow-lg shadow-emerald-200 transform active:scale-95 transition-all"
                     >
                        <MdCheckCircleOutline size={22} className="mr-2" /> Setujui Request
                     </Button>
                  </div>
               </div>
             )}
          </div>
      )}

      {/* Main Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-10 border-t border-slate-100">
        <Button 
          variant="outline" 
          onClick={onClose} 
          className="rounded-2xl px-10 h-14 border-2 border-slate-200 font-extrabold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all w-full sm:w-auto"
        >
          <MdClose size={20} className="mr-2" /> Tutup Detail
        </Button>
        
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {request.status === "draft" && (
            <Button 
              onClick={handleSubmit} 
              disabled={submitMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-14 h-14 font-black shadow-2xl shadow-indigo-200 flex items-center group transform active:scale-95 transition-all w-full sm:w-auto"
            >
              {submitMutation.isPending ? (
                <MdSync size={24} className="animate-spin mr-3" />
              ) : (
                <MdSend size={24} className="mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
              )}
              Submit Request
            </Button>
          )}

          {request.status === "approved" && (
            <Button 
              onClick={handleComplete} 
              disabled={completeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-14 h-14 font-black shadow-2xl shadow-emerald-200 flex items-center transform active:scale-95 transition-all w-full sm:w-auto"
            >
              {completeMutation.isPending ? (
                <MdSync size={24} className="animate-spin mr-3" />
              ) : (
                <MdCheckCircleOutline size={24} className="mr-3" /> 
              )}
              Tandai Selesai & Kirim
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductRequestDetails;
