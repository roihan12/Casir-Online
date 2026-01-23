import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { 
  useKreditRekomendasiList, 
  useApproveKreditRekomendasi 
} from "@common/hooks/useKreditRekomendasiQueries";
import { formatRupiah, formatDate } from "@common/utils/formatter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@common/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@common/components/ui/table";
import { Button } from "@common/components/ui/button";
import { Badge } from "@common/components/ui/badge";
import { Input } from "@common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@common/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@common/components/ui/dialog";
import { Textarea } from "@common/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Search, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@common/components/ui/pagination";

const KreditRekomendasiManagement = () => {
  const [filters, setFilters] = useState({
    status_persetujuan: "",
    search: "",
    page: 1,
    limit: 10,
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRekomendasi, setSelectedRekomendasi] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState("disetujui");
  const [catatan, setCatatan] = useState("");

  const { 
    data: rekomendasiData, 
    isLoading: isLoadingRekomendasi,
    refetch: refetchRekomendasi
  } = useKreditRekomendasiList(filters);

  const { 
    mutate: approveRekomendasi, 
    isPending: isApprovingRekomendasi 
  } = useApproveKreditRekomendasi();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value // Reset page when changing other filters
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    refetchRekomendasi();
  };

  const handleViewDetail = (rekomendasi) => {
    setSelectedRekomendasi(rekomendasi);
    setDetailModalOpen(true);
  };

  const handleOpenApprovalModal = (rekomendasi, initialStatus = "disetujui") => {
    setSelectedRekomendasi(rekomendasi);
    setApprovalStatus(initialStatus);
    setCatatan("");
    setApprovalModalOpen(true);
  };

  const handleApproveRekomendasi = () => {
    if (!selectedRekomendasi) return;

    approveRekomendasi(
      {
        id: selectedRekomendasi.id,
        data: {
          status_persetujuan: approvalStatus,
          catatan: catatan
        }
      },
      {
        onSuccess: () => {
          setApprovalModalOpen(false);
          refetchRekomendasi();
        }
      }
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "disetujui":
        return <Badge variant="success">Disetujui</Badge>;
      case "ditolak":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">Menunggu</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Manajemen Rekomendasi Kredit | Casir Online</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manajemen Rekomendasi Kredit</h1>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Filter</CardTitle>
            <CardDescription>
              Filter rekomendasi kredit berdasarkan status dan pencarian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={filters.status_persetujuan}
                  onValueChange={(value) => handleFilterChange("status_persetujuan", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status Persetujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="disetujui">Disetujui</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-[2] min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Cari berdasarkan nama pelanggan atau ID transaksi"
                    className="pl-8"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit">Terapkan Filter</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Daftar Rekomendasi Kredit</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRekomendasi ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !rekomendasiData?.data?.items?.length ? (
              <div className="text-center py-10 text-gray-500">
                Tidak ada data rekomendasi kredit yang ditemukan
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Transaksi</TableHead>
                        <TableHead>Skor Kredit</TableHead>
                        <TableHead>Limit Kredit</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rekomendasiData.data.items.map((rekomendasi) => (
                        <TableRow key={rekomendasi.id}>
                          <TableCell className="font-medium">
                            {rekomendasi.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>{rekomendasi.pelanggan?.nama || "-"}</TableCell>
                          <TableCell>
                            {rekomendasi.transaksi_id ? (
                              <span className="text-xs">
                                {rekomendasi.transaksi_id.substring(0, 8)}...
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                rekomendasi.credit_score >= 70 
                                  ? "success" 
                                  : rekomendasi.credit_score >= 50 
                                  ? "warning" 
                                  : "destructive"
                              }
                            >
                              {rekomendasi.credit_score}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatRupiah(rekomendasi.credit_limit)}</TableCell>
                          <TableCell>{formatRupiah(rekomendasi.total_amount)}</TableCell>
                          <TableCell>{getStatusBadge(rekomendasi.status_persetujuan)}</TableCell>
                          <TableCell>{formatDate(rekomendasi.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(rekomendasi)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {rekomendasi.status_persetujuan === "pending" && (
                                <>
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleOpenApprovalModal(rekomendasi, "disetujui")}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleOpenApprovalModal(rekomendasi, "ditolak")}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {rekomendasiData.data.pagination && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handleFilterChange(
                              "page", 
                              Math.max(1, filters.page - 1)
                            )}
                            disabled={filters.page <= 1}
                          />
                        </PaginationItem>
                        
                        {Array.from(
                          { length: rekomendasiData.data.pagination.totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === filters.page}
                              onClick={() => handleFilterChange("page", page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handleFilterChange(
                              "page", 
                              Math.min(
                                rekomendasiData.data.pagination.totalPages, 
                                filters.page + 1
                              )
                            )}
                            disabled={
                              filters.page >= rekomendasiData.data.pagination.totalPages
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      {selectedRekomendasi && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detail Rekomendasi Kredit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ID</h3>
                  <p>{selectedRekomendasi.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p>{getStatusBadge(selectedRekomendasi.status_persetujuan)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Pelanggan</h3>
                  <p>{selectedRekomendasi.pelanggan?.nama || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Transaksi ID</h3>
                  <p>{selectedRekomendasi.transaksi_id || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Skor Kredit</h3>
                  <p>{selectedRekomendasi.credit_score}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Limit Kredit</h3>
                  <p>{formatRupiah(selectedRekomendasi.credit_limit)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total</h3>
                  <p>{formatRupiah(selectedRekomendasi.total_amount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tanggal Dibuat</h3>
                  <p>{formatDate(selectedRekomendasi.createdAt)}</p>
                </div>
              </div>

              {selectedRekomendasi.catatan && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Catatan</h3>
                  <p className="text-sm">{selectedRekomendasi.catatan}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Opsi Pembayaran</h3>
                <div className="space-y-3">
                  {selectedRekomendasi.opsiPembayaranKredit?.map((opsi) => (
                    <Card key={opsi.id} className="p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Cicilan</p>
                          <p className="font-semibold">{opsi.jumlah_cicilan}x</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Durasi</p>
                          <p className="font-semibold">{opsi.durasi_bulan} bulan</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Bunga</p>
                          <p className="font-semibold">{opsi.bunga_persen}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Biaya Admin</p>
                          <p className="font-semibold">{formatRupiah(opsi.biaya_admin)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Cicilan per Bulan</p>
                          <p className="font-semibold">{formatRupiah(opsi.cicilan_per_bulan)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Pembayaran</p>
                          <p className="font-semibold">{formatRupiah(opsi.total_pembayaran)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDetailModalOpen(false)}>Tutup</Button>
              {selectedRekomendasi.status_persetujuan === "pending" && (
                <>
                  <Button 
                    variant="success" 
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenApprovalModal(selectedRekomendasi, "disetujui");
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenApprovalModal(selectedRekomendasi, "ditolak");
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Modal */}
      {selectedRekomendasi && (
        <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {approvalStatus === "disetujui" ? "Setujui" : "Tolak"} Rekomendasi Kredit
              </DialogTitle>
              <DialogDescription>
                {approvalStatus === "disetujui"
                  ? "Rekomendasi kredit ini akan disetujui dan pelanggan dapat melakukan transaksi kredit."
                  : "Rekomendasi kredit ini akan ditolak dan pelanggan tidak dapat melakukan transaksi kredit."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Catatan (opsional)</label>
                <Textarea
                  placeholder="Tambahkan catatan untuk persetujuan atau penolakan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setApprovalModalOpen(false)}
                disabled={isApprovingRekomendasi}
              >
                Batal
              </Button>
              <Button
                variant={approvalStatus === "disetujui" ? "success" : "destructive"}
                onClick={handleApproveRekomendasi}
                disabled={isApprovingRekomendasi}
              >
                {isApprovingRekomendasi ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses
                  </>
                ) : (
                  <>
                    {approvalStatus === "disetujui" ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    {approvalStatus === "disetujui" ? "Setujui" : "Tolak"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default KreditRekomendasiManagement;
