import { AlertTriangle } from 'lucide-react';
import React from 'react'

function AlertLowStockProduct({criticalAlerts}) {
  return (
    <div className="mx-6 mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start">
      <AlertTriangle className="text-yellow-500 mr-3 mt-0.5" size={20} />
      <div>
        <h3 className="font-medium text-yellow-800">Peringatan Stok</h3>
        <p className="text-sm text-yellow-700">
          {criticalAlerts.lowStockProducts.count} produk memiliki stok di bawah
          minimum.
          <a href="/inventory" className="ml-2 text-yellow-800 underline">
            Periksa sekarang
          </a>
        </p>
      </div>
    </div>
  );
}

export default AlertLowStockProduct