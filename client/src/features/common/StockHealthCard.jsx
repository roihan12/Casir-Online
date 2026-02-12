const StockHealthCard = ({ stockHealth, cabang, isGlobalView }) => {
  // Default values if no data
  const data = stockHealth || {
    total: 0,
    healthy: { count: 0, percentage: 0 },
    lowStock: { count: 0, percentage: 0 },
    outOfStock: { count: 0, percentage: 0 },
    overstock: { count: 0, percentage: 0 },
  };

  // Color classes for status
  const statusColors = {
    healthy: "bg-green-500",
    lowStock: "bg-yellow-500",
    outOfStock: "bg-red-500",
    overstock: "bg-blue-500",
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium">
          {isGlobalView
            ? "Kesehatan Stok (Semua Cabang)"
            : `Kesehatan Stok (${cabang})`}
        </h3>
        <div className="text-xs text-gray-500">Total: {data.total} produk</div>
      </div>

      <div className="mb-4">
        <div className="w-full h-8 bg-gray-200 rounded-lg flex overflow-hidden">
          <div
            className={`${statusColors.healthy}`}
            style={{ width: `${data.healthy.percentage}%` }}
          ></div>
          <div
            className={`${statusColors.lowStock}`}
            style={{ width: `${data.lowStock.percentage}%` }}
          ></div>
          <div
            className={`${statusColors.outOfStock}`}
            style={{ width: `${data.outOfStock.percentage}%` }}
          ></div>
          <div
            className={`${statusColors.overstock}`}
            style={{ width: `${data.overstock.percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">Stok Sehat</span>
          </div>
          <div className="mt-1 text-lg font-semibold">
            {data.healthy.count} produk
          </div>
          <div className="text-xs text-gray-500">
            {data.healthy.percentage.toFixed(1)}% dari total
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm">Stok Rendah</span>
          </div>
          <div className="mt-1 text-lg font-semibold">
            {data.lowStock.count} produk
          </div>
          <div className="text-xs text-gray-500">
            {data.lowStock.percentage.toFixed(1)}% dari total
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Habis</span>
          </div>
          <div className="mt-1 text-lg font-semibold">
            {data.outOfStock.count} produk
          </div>
          <div className="text-xs text-gray-500">
            {data.outOfStock.percentage.toFixed(1)}% dari total
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm">Kelebihan Stok</span>
          </div>
          <div className="mt-1 text-lg font-semibold">
            {data.overstock.count} produk
          </div>
          <div className="text-xs text-gray-500">
            {data.overstock.percentage.toFixed(1)}% dari total
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockHealthCard;