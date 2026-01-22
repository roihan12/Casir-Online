import React, { useState } from 'react';
import { useKreditNotifikasiList, useSendKreditNotifikasi, useMarkNotifikasiRead, useCancelKreditNotifikasi } from '../../../hooks/useKreditNotifikasi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "../../ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Pagination } from '../../ui/pagination';
import { DatePicker } from '../../ui/date-picker';
import { Loader2, Send, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../ErrorFallback';

// Skema validasi untuk filter
const filterSchema = z.object({
  kreditTransaksiId: z.string().optional(),
  pelangganId: z.string().optional(),
  jenisNotifikasi: z.string().optional(),
  statusNotifikasi: z.string().optional(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
});

const KreditNotifikasiList = () => {
  // State untuk pagination dan sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Setup form dengan react-hook-form dan zod
  const form = useForm({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      kreditTransaksiId: '',
      pelangganId: '',
      jenisNotifikasi: '',
      statusNotifikasi: '',
      startDate: null,
      endDate: null,
    },
  });

  // Dapatkan nilai filter dari form
  const filterValues = form.watch();

  // Gabungkan semua filter untuk query
  const filters = {
    ...filterValues,
    page,
    limit,
    sortBy,
    sortOrder,
    startDate: filterValues.startDate ? format(filterValues.startDate, 'yyyy-MM-dd') : undefined,
    endDate: filterValues.endDate ? format(filterValues.endDate, 'yyyy-MM-dd') : undefined,
  };

  // Query untuk mendapatkan daftar notifikasi
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useKreditNotifikasiList(filters);

  // Mutations untuk aksi notifikasi
  const sendNotifikasi = useSendKreditNotifikasi();
  const markRead = useMarkNotifikasiRead();
  const cancelNotifikasi = useCancelKreditNotifikasi();

  // Handler untuk submit form filter
  const onSubmit = (data) => {
    setPage(1); // Reset ke halaman pertama saat filter berubah
    // Filter sudah otomatis diaplikasikan karena kita menggunakan form.watch()
  };

  // Handler untuk reset form
  const resetForm = () => {
    form.reset({
      kreditTransaksiId: '',
      pelangganId: '',
      jenisNotifikasi: '',
      statusNotifikasi: '',
      startDate: null,
      endDate: null,
    });
    setPage(1);
  };

  // Handler untuk pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handler untuk mengubah jumlah item per halaman
  const handleLimitChange = (newLimit) => {
    setLimit(parseInt(newLimit));
    setPage(1); // Reset ke halaman pertama saat limit berubah
  };

  // Handler untuk sorting
  const handleSortChange = (column) => {
    if (sortBy === column) {
      // Jika kolom yang sama, ubah arah sorting
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Jika kolom berbeda, set kolom baru dan default ke descending
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Handler untuk mengirim notifikasi
  const handleSendNotifikasi = async (id) => {
    try {
      await sendNotifikasi.mutateAsync(id);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Handler untuk menandai notifikasi dibaca
  const handleMarkRead = async (id) => {
    try {
      await markRead.mutateAsync(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handler untuk membatalkan notifikasi
  const handleCancelNotifikasi = async (id) => {
    try {
      await cancelNotifikasi.mutateAsync(id);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  // Render badge untuk status notifikasi
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Menunggu</Badge>;
      case 'SENT':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Terkirim</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Gagal</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render badge untuk jenis notifikasi
  const renderJenisBadge = (jenis) => {
    switch (jenis) {
      case 'PENGINGAT_SEBELUM_JATUH_TEMPO':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pengingat Sebelum Jatuh Tempo</Badge>;
      case 'PENGINGAT_HARI_JATUH_TEMPO':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Pengingat Hari Jatuh Tempo</Badge>;
      case 'PENGINGAT_SETELAH_JATUH_TEMPO':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Pengingat Setelah Jatuh Tempo</Badge>;
      case 'PEMBAYARAN_TERLAMBAT':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Pembayaran Terlambat</Badge>;
      case 'PEMBAYARAN_BERHASIL':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pembayaran Berhasil</Badge>;
      case 'KREDIT_LUNAS':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Kredit Lunas</Badge>;
      default:
        return <Badge variant="outline">{jenis}</Badge>;
    }
  };

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: id });
  };

  // Format metode pengiriman
  const formatMetodePengiriman = (metode) => {
    if (!metode || !metode.length) return '-';
    return metode.join(', ');
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daftar Notifikasi Kredit</CardTitle>
          <CardDescription>
            Kelola notifikasi untuk transaksi kredit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form Filter */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="kreditTransaksiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Transaksi Kredit</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan ID transaksi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pelangganId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Pelanggan</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan ID pelanggan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="jenisNotifikasi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Notifikasi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis notifikasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Semua</SelectItem>
                          <SelectItem value="PENGINGAT_SEBELUM_JATUH_TEMPO">Pengingat Sebelum Jatuh Tempo</SelectItem>
                          <SelectItem value="PENGINGAT_HARI_JATUH_TEMPO">Pengingat Hari Jatuh Tempo</SelectItem>
                          <SelectItem value="PENGINGAT_SETELAH_JATUH_TEMPO">Pengingat Setelah Jatuh Tempo</SelectItem>
                          <SelectItem value="PEMBAYARAN_TERLAMBAT">Pembayaran Terlambat</SelectItem>
                          <SelectItem value="PEMBAYARAN_BERHASIL">Pembayaran Berhasil</SelectItem>
                          <SelectItem value="KREDIT_LUNAS">Kredit Lunas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="statusNotifikasi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Notifikasi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status notifikasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Semua</SelectItem>
                          <SelectItem value="PENDING">Menunggu</SelectItem>
                          <SelectItem value="SENT">Terkirim</SelectItem>
                          <SelectItem value="FAILED">Gagal</SelectItem>
                          <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Mulai</FormLabel>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholderText="Pilih tanggal mulai"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Akhir</FormLabel>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholderText="Pilih tanggal akhir"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Reset
                </Button>
                <Button type="submit">Filter</Button>
              </div>
            </form>
          </Form>
          
          {/* Tabel Notifikasi */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSortChange('createdAt')}
                  >
                    Tanggal Dibuat
                    {sortBy === 'createdAt' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead>Jenis Notifikasi</TableHead>
                  <TableHead>Angsuran Ke</TableHead>
                  <TableHead>Tanggal Jatuh Tempo</TableHead>
                  <TableHead>Jumlah Tagihan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Metode Pengiriman</TableHead>
                  <TableHead>Dibaca</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Memuat data...</p>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-red-500">
                      Error: {error?.message || 'Terjadi kesalahan saat memuat data'}
                    </TableCell>
                  </TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Tidak ada data notifikasi kredit
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((notifikasi) => (
                    <TableRow key={notifikasi.id}>
                      <TableCell>{formatDate(notifikasi.createdAt)}</TableCell>
                      <TableCell>{renderJenisBadge(notifikasi.jenisNotifikasi)}</TableCell>
                      <TableCell>{notifikasi.angsuranKe}</TableCell>
                      <TableCell>{formatDate(notifikasi.tanggalJatuhTempo)}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(notifikasi.jumlahTagihan)}
                      </TableCell>
                      <TableCell>{renderStatusBadge(notifikasi.statusNotifikasi)}</TableCell>
                      <TableCell>{formatMetodePengiriman(notifikasi.metodePengiriman)}</TableCell>
                      <TableCell>
                        {notifikasi.dibaca ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Dibaca {formatDate(notifikasi.dibacaPada)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Belum Dibaca
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {notifikasi.statusNotifikasi === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendNotifikasi(notifikasi.id)}
                                disabled={sendNotifikasi.isPending}
                                title="Kirim Notifikasi"
                              >
                                {sendNotifikasi.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelNotifikasi(notifikasi.id)}
                                disabled={cancelNotifikasi.isPending}
                                title="Batalkan Notifikasi"
                              >
                                {cancelNotifikasi.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                          {!notifikasi.dibaca && notifikasi.statusNotifikasi === 'SENT' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkRead(notifikasi.id)}
                              disabled={markRead.isPending}
                              title="Tandai Dibaca"
                            >
                              {markRead.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {data?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Menampilkan {data.pagination.totalItems === 0 ? 0 : (page - 1) * limit + 1} - {Math.min(page * limit, data.pagination.totalItems)} dari {data.pagination.totalItems} item
                </span>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder={limit} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 / hal</SelectItem>
                    <SelectItem value="10">10 / hal</SelectItem>
                    <SelectItem value="25">25 / hal</SelectItem>
                    <SelectItem value="50">50 / hal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                onPageChange={handlePageChange}
              />
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default KreditNotifikasiList;
