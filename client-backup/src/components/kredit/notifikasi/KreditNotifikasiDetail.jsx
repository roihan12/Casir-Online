import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import kreditNotifikasiService from '../../../services/kreditNotifikasiService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { 
  useSendKreditNotifikasi, 
  useMarkNotifikasiRead, 
  useCancelKreditNotifikasi 
} from '../../../hooks/useKreditNotifikasi';
import { Loader2, ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../ErrorFallback';

const KreditNotifikasiDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Query untuk mendapatkan detail notifikasi
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery({
    queryKey: ['kreditNotifikasi', id],
    queryFn: async () => {
      // Karena tidak ada endpoint khusus untuk detail, kita gunakan filter berdasarkan ID
      const response = await kreditNotifikasiService.getKreditNotifikasi({ id });
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      throw new Error('Notifikasi tidak ditemukan');
    },
  });
  
  // Mutations untuk aksi notifikasi
  const sendNotifikasi = useSendKreditNotifikasi();
  const markRead = useMarkNotifikasiRead();
  const cancelNotifikasi = useCancelKreditNotifikasi();
  
  // Handler untuk mengirim notifikasi
  const handleSendNotifikasi = async () => {
    try {
      await sendNotifikasi.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  
  // Handler untuk menandai notifikasi dibaca
  const handleMarkRead = async () => {
    try {
      await markRead.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Handler untuk membatalkan notifikasi
  const handleCancelNotifikasi = async () => {
    try {
      await cancelNotifikasi.mutateAsync(id);
      refetch();
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Memuat data notifikasi...</p>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-700">
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p>{error?.message || 'Terjadi kesalahan saat memuat data notifikasi'}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }
  
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </div>
      
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Detail Notifikasi Kredit</CardTitle>
              <CardDescription>
                ID: {data?.id}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {data?.statusNotifikasi === 'PENDING' && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSendNotifikasi}
                    disabled={sendNotifikasi.isPending}
                    title="Kirim Notifikasi"
                  >
                    {sendNotifikasi.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Kirim
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelNotifikasi}
                    disabled={cancelNotifikasi.isPending}
                    title="Batalkan Notifikasi"
                  >
                    {cancelNotifikasi.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Batalkan
                  </Button>
                </>
              )}
              {!data?.dibaca && data?.statusNotifikasi === 'SENT' && (
                <Button
                  variant="outline"
                  onClick={handleMarkRead}
                  disabled={markRead.isPending}
                  title="Tandai Dibaca"
                >
                  {markRead.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Tandai Dibaca
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Jenis Notifikasi</h3>
                <div>{renderJenisBadge(data?.jenisNotifikasi)}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <div>{renderStatusBadge(data?.statusNotifikasi)}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Metode Pengiriman</h3>
                <div>{formatMetodePengiriman(data?.metodePengiriman)}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Dibaca</h3>
                <div>
                  {data?.dibaca ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Dibaca pada {formatDate(data?.dibacaPada)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Belum Dibaca
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tanggal Dibuat</h3>
                <div>{formatDate(data?.createdAt)}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tanggal Dikirim</h3>
                <div>{data?.dikirimPada ? formatDate(data?.dikirimPada) : '-'}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Angsuran Ke</h3>
                <div>{data?.angsuranKe}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tanggal Jatuh Tempo</h3>
                <div>{formatDate(data?.tanggalJatuhTempo)}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Jumlah Tagihan</h3>
                <div className="font-semibold">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(data?.jumlahTagihan)}
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pesan Notifikasi</h3>
            <div className="p-4 rounded-md bg-gray-50 whitespace-pre-wrap">
              {data?.pesanNotifikasi || 'Tidak ada pesan notifikasi'}
            </div>
          </div>
          
          {data?.errorPengiriman && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="text-sm font-medium text-red-500 mb-2">Error Pengiriman</h3>
                <div className="p-4 rounded-md bg-red-50 text-red-700 whitespace-pre-wrap">
                  {data?.errorPengiriman}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default KreditNotifikasiDetail;
