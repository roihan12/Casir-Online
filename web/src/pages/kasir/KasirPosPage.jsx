import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Barcode, User, Clock, Plus, Minus, Trash2, ShoppingCart, 
  CreditCard, Banknote, QrCode, Receipt, X, AlertTriangle, Keyboard, HelpCircle,
  ChevronRight, Check, Loader2, Package
} from 'lucide-react';
import { Card, Button, Modal, Input, Tooltip } from '@shared/ui';
import { useKeyboardShortcuts, SHORTCUT_HELP, useBranch } from '@shared/hooks';
import { 
  useActiveShift, useOpenShift, useCloseShift, 
  useSearchProducts, usePopularProducts, useCreateTransaction
} from '@entities/kasir';
import { formatRupiah, formatNumber, formatTime } from '@shared/lib';
import MainLayout from '@widgets/layout/MainLayout';

// ==================== HELPER COMPONENTS ====================

const ShiftBar = ({ shift, onOpenShift, onCloseShift, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Memuat shift...</span>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="glass p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Belum ada shift aktif</span>
        </div>
        <Button onClick={onOpenShift} leftIcon={<Clock className="w-4 h-4" />}>
          Buka Shift
        </Button>
      </div>
    );
  }

  return (
    <div className="glass p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Shift Aktif</span>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{shift.user?.namaLengkap}</span>
          {' • '}
          Mulai {formatTime(shift.waktuMulai)}
        </div>
        <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
          Kas Awal: <span className="font-medium text-gray-800">{formatRupiah(shift.kasAwal)}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onCloseShift}>
        <span className="text-xs text-gray-500 mr-2">[F10]</span>
        Tutup Shift
      </Button>
    </div>
  );
};

const CartItem = ({ item, onUpdateQty, onRemove, isSelected }) => (
  <div 
    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
      isSelected ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'glass-surface hover:bg-white/60'
    }`}
  >
    <div className="flex-1 min-w-0">
      <p className="font-medium text-gray-800 truncate">{item.name}</p>
      <p className="text-sm text-gray-500">{formatRupiah(item.price)}</p>
    </div>
    <div className="flex items-center gap-2">
      <button 
        onClick={() => onUpdateQty(item.id, item.qty - 1)}
        className="p-1 hover:bg-gray-200 rounded"
      >
        <Minus className="w-4 h-4 text-gray-500" />
      </button>
      <span className="w-8 text-center font-medium">{item.qty}</span>
      <button 
        onClick={() => onUpdateQty(item.id, item.qty + 1)}
        className="p-1 hover:bg-gray-200 rounded"
      >
        <Plus className="w-4 h-4 text-gray-500" />
      </button>
    </div>
    <p className="w-24 text-right font-semibold text-gray-800">
      {formatRupiah(item.price * item.qty)}
    </p>
    <button 
      onClick={() => onRemove(item.id)}
      className="p-1 hover:bg-red-100 rounded text-red-500"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

const ProductCard = ({ product, onAdd }) => (
  <button
    onClick={() => onAdd(product)}
    className="glass-surface p-4 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all text-left group"
  >
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform">
        <Package className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{product.produkMaster?.namaProduk || product.name}</p>
        <p className="text-sm text-gray-500">{product.kode || product.sku}</p>
        <p className="text-lg font-bold text-indigo-600 mt-1">{formatRupiah(product.hargaJual || product.price)}</p>
      </div>
    </div>
    <div className="mt-2 text-xs text-gray-400">
      Stok: {formatNumber(product.stok || product.stock || 0)}
    </div>
  </button>
);

// ==================== MAIN COMPONENT ====================

const KasirPosPage = () => {
  const { activeBranchName } = useBranch();
  const searchRef = useRef(null);
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [customer, setCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [kasAwal, setKasAwal] = useState('');
  const [kasAkhir, setKasAkhir] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [cashAmount, setCashAmount] = useState('');

  // Queries & Mutations
  const { data: shiftData, isLoading: shiftLoading } = useActiveShift();
  const { data: searchData, isLoading: searchLoading } = useSearchProducts(searchQuery);
  const { data: popularData, isLoading: popularLoading } = usePopularProducts();
  const openShift = useOpenShift();
  const closeShift = useCloseShift();
  const createTransaction = useCreateTransaction();

  const activeShift = shiftData?.data?.data;
  
  // Use search results when searching, otherwise show popular products
  const isSearching = searchQuery.length >= 2;
  const products = isSearching 
    ? (searchData?.data.data || []) 
    : (popularData?.data.data || []);
  const productsLoading = isSearching ? searchLoading : popularLoading;



  // Cart calculations
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.11); // 11% PPN
    const total = subtotal + tax;
    return { subtotal, tax, total, itemCount: cart.reduce((sum, item) => sum + item.qty, 0) };
  }, [cart]);

  // Change calculation
  const change = useMemo(() => {
    const paid = parseInt(cashAmount) || 0;
    return paid - cartTotals.total;
  }, [cashAmount, cartTotals.total]);

  // Cart actions
  const addToCart = useCallback((product) => {
    const id = product.id || product.produkId;
    const name = product.produkMaster?.namaProduk || product.name;
    const price = product.hargaJual || product.price;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => 
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id, name, price, qty: 1, product }];
    });
    setSearchQuery('');
    searchRef.current?.focus();
  }, []);

  const updateQty = useCallback((id, newQty) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item => 
        item.id === id ? { ...item, qty: newQty } : item
      ));
    }
  }, []);

  const removeItem = useCallback((id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomer(null);
    setSelectedItemIndex(-1);
  }, []);

  // Shift actions
  const handleOpenShift = async () => {
    const amount = parseInt(kasAwal) || 0;
    await openShift.mutateAsync(amount);
    setShowShiftModal(false);
    setKasAwal('');
  };

  const handleCloseShift = async () => {
    const amount = parseInt(kasAkhir) || 0;
    await closeShift.mutateAsync({ kasAkhir: amount });
    setShowCloseShiftModal(false);
    setKasAkhir('');
  };

  // Payment
  const handlePayment = async () => {
    if (cart.length === 0 || !activeShift) return;

    try {
      // Create transaction with backend-expected payload
      const transactionResult = await createTransaction.mutateAsync({
        jenis_transaksi: 'PENJUALAN',
        tanggal: new Date().toISOString(),
        pelanggan_id: customer?.id || null,
        shift_id: activeShift.id,
        details: cart.map(item => ({
          produk_id: item.id,
          jumlah: item.qty,
          harga_satuan: item.price,
          diskon_persen: 0,
          pajak_persen: 11, // 11% PPN
        })),
        biaya_tambahan: 0,
        keterangan: null,
      });

      // Success - clear cart
      clearCart();
      setShowPaymentModal(false);
      setCashAmount('');
      setPaymentMethod('tunai');
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    help: () => setShowHelpModal(true),
    focusSearch: () => searchRef.current?.focus(),
    openPayment: () => cart.length > 0 && activeShift && setShowPaymentModal(true),
    escape: () => {
      if (showPaymentModal) setShowPaymentModal(false);
      else if (showHelpModal) setShowHelpModal(false);
      else if (showShiftModal) setShowShiftModal(false);
      else if (showCloseShiftModal) setShowCloseShiftModal(false);
      else if (cart.length > 0 && window.confirm('Hapus semua item?')) clearCart();
    },
    closeShift: () => activeShift && setShowCloseShiftModal(true),
    deleteItem: () => {
      if (selectedItemIndex >= 0 && cart[selectedItemIndex]) {
        removeItem(cart[selectedItemIndex].id);
        setSelectedItemIndex(-1);
      }
    },
    increaseQty: () => {
      if (selectedItemIndex >= 0 && cart[selectedItemIndex]) {
        updateQty(cart[selectedItemIndex].id, cart[selectedItemIndex].qty + 1);
      }
    },
    decreaseQty: () => {
      if (selectedItemIndex >= 0 && cart[selectedItemIndex]) {
        updateQty(cart[selectedItemIndex].id, cart[selectedItemIndex].qty - 1);
      }
    },
  }, !showPaymentModal && !showShiftModal);

  // Auto focus search on mount
  useEffect(() => {
    if (activeShift) {
      searchRef.current?.focus();
    }
  }, [activeShift]);

  return (
    <MainLayout 
      title="Point of Sale"
      subtitle={activeBranchName}
    >
      {/* Shift Bar */}
      <ShiftBar 
        shift={activeShift}
        isLoading={shiftLoading}
        onOpenShift={() => setShowShiftModal(true)}
        onCloseShift={() => setShowCloseShiftModal(true)}
      />

      {/* Main Content */}
      <div className="grid lg:grid-cols-5 gap-6 mt-6">
        {/* Left: Products (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Cari produk atau scan barcode... [F2]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!activeShift}
              className="w-full pl-12 pr-4 py-4 glass-input text-lg rounded-xl disabled:opacity-50"
            />
            <Tooltip content="Shortcut: F1" position="left">
              <button
                onClick={() => setShowHelpModal(true)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
              >
                <Keyboard className="w-5 h-5 text-gray-400" />
              </button>
            </Tooltip>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {productsLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="glass-surface p-4 rounded-xl animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-5 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : products.length > 0 ? (
              products.slice(0, 9).map((product, idx) => (
                <ProductCard 
                  key={product.id || idx} 
                  product={product} 
                  onAdd={addToCart}
                />
              ))
            ) : searchQuery.length >= 2 && products.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                Produk tidak ditemukan
              </div>
            ) : !activeShift ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                Buka shift terlebih dahulu untuk mulai transaksi
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: Cart (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <Card.Header className="border-b">
              <div className="flex items-center justify-between">
                <Card.Title className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-500" />
                  Keranjang
                  {cartTotals.itemCount > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-sm rounded-full">
                      {cartTotals.itemCount}
                    </span>
                  )}
                </Card.Title>
                {cart.length > 0 && (
                  <button 
                    onClick={clearCart}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
            </Card.Header>

            <Card.Content className="flex-1 overflow-y-auto max-h-[400px]">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, idx) => (
                    <CartItem 
                      key={item.id}
                      item={item}
                      onUpdateQty={updateQty}
                      onRemove={removeItem}
                      isSelected={idx === selectedItemIndex}
                    />
                  ))}
                </div>
              )}
            </Card.Content>

            {/* Totals */}
            <div className="border-t p-4 space-y-2 bg-gray-50/50">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatRupiah(cartTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>PPN (11%)</span>
                <span>{formatRupiah(cartTotals.tax)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                <span>Total</span>
                <span>{formatRupiah(cartTotals.total)}</span>
              </div>
            </div>

            {/* Pay Button */}
            <div className="p-4 border-t">
              <Button 
                className="w-full py-4 text-lg"
                disabled={cart.length === 0 || !activeShift}
                onClick={() => setShowPaymentModal(true)}
              >
                <span className="text-sm opacity-70 mr-2">[F8]</span>
                Bayar
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Open Shift Modal */}
      <Modal 
        isOpen={showShiftModal} 
        onClose={() => setShowShiftModal(false)} 
        title="Buka Shift Baru"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Kas Awal"
            type="number"
            placeholder="0"
            value={kasAwal}
            onChange={(e) => setKasAwal(e.target.value)}
            leftIcon={<Banknote className="w-4 h-4" />}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowShiftModal(false)} className="flex-1">
              Batal
            </Button>
            <Button 
              onClick={handleOpenShift} 
              className="flex-1"
              disabled={openShift.isPending}
            >
              {openShift.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buka Shift'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close Shift Modal */}
      <Modal 
        isOpen={showCloseShiftModal} 
        onClose={() => setShowCloseShiftModal(false)} 
        title="Tutup Shift"
        size="sm"
      >
        <div className="space-y-4">
          <div className="glass-surface p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Kas Awal</span>
              <span className="font-medium">{formatRupiah(activeShift?.kasAwal || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Transaksi</span>
              <span className="font-medium text-emerald-600">+{formatRupiah(activeShift?.totalTransaksi || 0)}</span>
            </div>
          </div>
          <Input
            label="Kas Akhir"
            type="number"
            placeholder="Hitung kas di laci"
            value={kasAkhir}
            onChange={(e) => setKasAkhir(e.target.value)}
            leftIcon={<Banknote className="w-4 h-4" />}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCloseShiftModal(false)} className="flex-1">
              Batal
            </Button>
            <Button 
              onClick={handleCloseShift} 
              className="flex-1"
              disabled={closeShift.isPending}
            >
              {closeShift.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tutup Shift'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        title="Pembayaran"
        size="md"
      >
        <div className="space-y-6">
          {/* Total */}
          <div className="text-center py-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white">
            <p className="text-sm opacity-80">Total Pembayaran</p>
            <p className="text-4xl font-bold">{formatRupiah(cartTotals.total)}</p>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'tunai', label: 'Tunai', icon: Banknote },
              { id: 'qris', label: 'QRIS', icon: QrCode },
              { id: 'kartu', label: 'Kartu', icon: CreditCard },
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === method.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <method.icon className={`w-8 h-8 mx-auto mb-2 ${
                  paymentMethod === method.id ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  paymentMethod === method.id ? 'text-indigo-600' : 'text-gray-600'
                }`}>
                  {method.label}
                </span>
              </button>
            ))}
          </div>

          {/* Cash Amount (only for tunai) */}
          {paymentMethod === 'tunai' && (
            <div className="space-y-3">
              <Input
                label="Jumlah Bayar"
                type="number"
                placeholder="0"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                leftIcon={<Banknote className="w-4 h-4" />}
              />
              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2">
                {[cartTotals.total, 50000, 100000, 200000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashAmount(String(amount))}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    {formatRupiah(amount)}
                  </button>
                ))}
              </div>
              {change >= 0 && cashAmount && (
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-600">Kembalian</p>
                  <p className="text-2xl font-bold text-emerald-700">{formatRupiah(change)}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
              Batal
            </Button>
            <Button 
              onClick={handlePayment} 
              className="flex-1"
              disabled={
                createTransaction.isPending || 
                (paymentMethod === 'tunai' && change < 0)
              }
            >
              {createTransaction.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Konfirmasi
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
        title="Keyboard Shortcuts"
        size="sm"
      >
        <div className="space-y-2">
          {SHORTCUT_HELP.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-gray-600">{item.description}</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{item.key}</kbd>
            </div>
          ))}
        </div>
      </Modal>
    </MainLayout>
  );
};

export default KasirPosPage;
