import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSlipDetail } from '../hooks/usePayrollQueries';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const PrintSlipGajiPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const { data: detailData, isLoading, error } = useSlipDetail(id);
  const slip = detailData?.data;

  // Auto-print when data is loaded
  useEffect(() => {
    if (slip && !isLoading && !error) {
      // Tunggu sebentar agar render selesai dan font ter-load
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [slip, isLoading, error]);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka || 0);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100">Menyiapkan dokumen...</div>;
  }

  if (error || !slip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">Gagal Memuat Slip Gaji!</h2>
        <p className="text-slate-600 mb-4">{error?.message || 'Data slip gaji tidak ditemukan.'}</p>
        <button 
          onClick={() => window.close()} 
          className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700"
        >
          Tutup Halaman Ini
        </button>
      </div>
    );
  }

  // Calculate totals for rendering details safely
  const slipDetail = slip.slip_gaji_detail || [];
  const tunjanganList = slipDetail.filter(d => d.tipe === 'tunjangan');
  const potonganList = slipDetail.filter(d => d.tipe === 'potongan');
  
  const totalPemasukanText = formatRupiah(slip.total_pemasukan || (Number(slip.gaji_pokok) + Number(slip.total_lembur) + Number(slip.total_tunjangan)));
  const totalPotonganText = formatRupiah(slip.total_potongan);
  
  const companyName = slip.cabang?.namaCabang || "Perusahaan"; // Sesuaikan jika ada relasi cabang, sementara fallback to Perusahaan

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800 print:bg-white print:m-0 print:p-0 flex justify-center">
      
      {/* Tombol bantu di layar normal (tidak diprint) */}
      <div className="fixed top-4 right-4 z-50 print:hidden flex gap-2">
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 text-sm font-medium"
        >
          Cetak Ulang / Download PDF
        </button>
        <button 
          onClick={() => window.close()} 
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded shadow hover:bg-slate-300 text-sm font-medium"
        >
          Tutup
        </button>
      </div>

      {/* Kontainer Kertas A4 */}
      <div 
        ref={printRef}
        className="bg-white w-full max-w-[210mm] my-8 p-10 shadow-lg print:shadow-none print:my-0 print:mx-auto print:max-w-none print:w-[210mm] min-h-[297mm] box-border relative"
      >
        
        {/* Header Perusahaan & Judul */}
        <div className="border-b-2 border-slate-800 pb-4 mb-8 text-center relative flex justify-between items-center">
          <div className="text-left">
             <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">{companyName}</h1>
             <p className="text-sm text-slate-500 mt-1">Slip Gaji Karyawan</p>
          </div>
          <div className="text-right">
             <div className="text-sm text-slate-500 uppercase tracking-widest mb-1">Periode</div>
             <div className="text-xl font-bold bg-slate-100 px-3 py-1 rounded inline-block">
               {slip.periode}
             </div>
          </div>
        </div>

        {/* Informasi Karyawan */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-10 text-sm border p-4 rounded bg-slate-50">
          <div className="flex">
            <span className="w-1/3 text-slate-500 font-semibold">Nama</span>
            <span className="w-2/3 font-bold uppercase">: {slip.user?.namaLengkap || slip.user?.username}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-slate-500 font-semibold">Tipe Gaji</span>
            <span className="w-2/3 capitalize">: {slip.gaji_pokok_detail?.tipe_gaji || 'Bulanan'}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-slate-500 font-semibold">ID / NIK</span>
            <span className="w-2/3">: {slip.user?.username || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-slate-500 font-semibold">Tanggal Cetak</span>
            <span className="w-2/3">: {format(new Date(), 'dd MMMM yyyy', {locale: localeId})}</span>
          </div>
        </div>

        {/* Rincian Finansial Dua Kolom */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          
          {/* Kolom Pemasukan */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-2 mb-3">Pemasukan</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span>Gaji Pokok</span>
                <span className="font-medium">{formatRupiah(slip.gaji_pokok)}</span>
              </div>
              
              {Number(slip.total_jam_lembur) > 0 && (
                <div className="flex justify-between items-center">
                  <span>Lembur ({slip.total_jam_lembur} Jam)</span>
                  <span className="font-medium">{formatRupiah(slip.total_lembur)}</span>
                </div>
              )}
              
              {tunjanganList.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{t.nama}</span>
                  <span className="font-medium">{formatRupiah(t.nilai)}</span>
                </div>
              ))}
              
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-3 border-t border-slate-800 font-bold">
              <span>Total Pemasukan (A)</span>
              <span>{totalPemasukanText}</span>
            </div>
          </div>

          /* Kolom Potongan */
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-2 mb-3">Potongan</h3>
            <div className="space-y-3 text-sm text-slate-700">
              
              {Number(slip.total_hari_absen_potong) > 0 && (
                <div className="flex justify-between items-center">
                  <span>Absen / Izin ({slip.total_hari_absen_potong} Hari)</span>
                  <span className="font-medium">{formatRupiah(slip.total_potongan_absen)}</span>
                </div>
              )}
              
              {potonganList.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{p.nama}</span>
                  <span className="font-medium">{formatRupiah(p.nilai)}</span>
                </div>
              ))}
              
              {Number(slip.total_potongan_absen) === 0 && potonganList.length === 0 && (
                 <div className="text-slate-400 italic text-center py-2">Tidak ada potongan</div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-3 border-t border-slate-800 font-bold text-slate-900">
              <span>Total Potongan (B)</span>
              <span>{totalPotonganText}</span>
            </div>
          </div>

        </div>

        {/* Take Home Pay */}
        <div className="mt-12 bg-slate-800 text-white p-6 rounded-lg print:bg-slate-100 print:text-black print:border-2 print:border-slate-800 flex items-center justify-between shadow-inner">
           <div>
             <div className="text-slate-300 print:text-slate-600 font-bold uppercase text-xs tracking-widest mb-1">Gaji Bersih / Penerimaan</div>
             <div className="text-sm opacity-80">(Total Pemasukan A - Total Potongan B)</div>
           </div>
           <div className="text-3xl font-black">
              {formatRupiah(slip.gaji_bersih)}
           </div>
        </div>

        {/* Otorisasi / TTD */}
        <div className="mt-20 grid grid-cols-2 text-center text-sm">
           <div>
             <div className="mb-20">Diterima Oleh,</div>
             <div className="font-bold uppercase border-b border-slate-400 inline-block min-w-[150px] pb-1">
               {slip.user?.namaLengkap || slip.user?.username}
             </div>
             <div className="text-slate-500 text-xs mt-1">Karyawan</div>
           </div>
           <div>
             <div className="mb-20">Disetujui Oleh,</div>
             <div className="font-bold uppercase border-b border-slate-400 inline-block min-w-[150px] pb-1">
               HR / Manajemen
             </div>
             <div className="text-slate-500 text-xs mt-1">{companyName}</div>
           </div>
        </div>

        {/* Footer info dokumen */}
        <div className="absolute bottom-10 left-10 text-[10px] text-slate-400">
          Dokumen ini digenerate secara otomatis oleh sistem Casir-Online pada {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default PrintSlipGajiPage;
