import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Eye, Calendar, Filter, Download } from 'lucide-react';
import { Card, Button, Input, DataTable, Modal } from '@shared/ui';
import { useTransactions } from '@entities/transaction';
import { formatRupiah, formatDateTime } from '@shared/lib';
import MainLayout from '@widgets/layout/MainLayout';

const statusColors = {
  selesai: 'badge-success',
  pending: 'badge-warning',
  dibatalkan: 'badge-danger',
  kredit: 'badge-info',
};

const statusLabels = {
  selesai: 'Selesai',
  pending: 'Pending',
  dibatalkan: 'Dibatalkan',
  kredit: 'Kredit',
};

const TransactionsListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: txData, isLoading } = useTransactions({ 
    page, 
    limit: 10, 
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const transactions = txData?.data?.transactions || [];
  const pagination = txData?.data?.pagination;

  const columns = [
    {
      key: 'nomorTransaksi',
      header: 'No. Transaksi',
      render: (value) => (
        <span className="font-mono text-sm text-indigo-600">{value}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Tanggal',
      sortable: true,
      render: (value) => formatDateTime(value),
    },
    {
      key: 'pelanggan',
      header: 'Pelanggan',
      render: (_, row) => row.pelanggan?.nama || 'Umum',
    },
    {
      key: 'totalItem',
      header: 'Item',
      render: (_, row) => row.items?.length || 0,
    },
    {
      key: 'totalHarga',
      header: 'Total',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-gray-800">{formatRupiah(value)}</span>
      ),
    },
    {
      key: 'metodePembayaran',
      header: 'Pembayaran',
      render: (value) => value?.toUpperCase() || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span className={`badge ${statusColors[value] || 'bg-gray-100 text-gray-600'}`}>
          {statusLabels[value] || value}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/transaksi/${row.id}`); }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4 text-gray-500" />
        </button>
      ),
    },
  ];

  return (
    <MainLayout title="Transaksi" subtitle="Riwayat transaksi penjualan">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-indigo-500">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{pagination?.total || 0}</p>
              <p className="text-sm text-gray-500">Total Transaksi</p>
            </div>
          </div>
        </Card>
        {['selesai', 'pending', 'kredit'].map((status) => (
          <Card key={status} className="bg-white/70">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl glass-surface ${
                status === 'selesai' ? 'text-emerald-500' : 
                status === 'pending' ? 'text-amber-500' : 'text-blue-500'
              }`}>
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {transactions.filter(t => t.status === status).length}
                </p>
                <p className="text-sm text-gray-500">{statusLabels[status]}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Cari no. transaksi..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Button 
              variant="secondary" 
              leftIcon={<Filter className="w-5 h-5" />}
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-700"
            >
              Filter
            </Button>
          </div>
          <Button variant="secondary" leftIcon={<Download className="w-5 h-5" />} className="text-gray-700">
            Export
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="glass-input px-4 py-2 rounded-lg text-gray-700"
            >
              <option value="">Semua Status</option>
              <option value="selesai">Selesai</option>
              <option value="pending">Pending</option>
              <option value="kredit">Kredit</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={transactions}
          loading={isLoading}
          pagination={pagination ? {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
          } : null}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/transaksi/${row.id}`)}
          emptyMessage="Belum ada transaksi"
        />
      </Card>
    </MainLayout>
  );
};

export default TransactionsListPage;
