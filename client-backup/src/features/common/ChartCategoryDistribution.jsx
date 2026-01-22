import { ChevronDown } from "lucide-react";
import formatCurrency from "../../utils/formatCurrency";

const ChartCategoryDistribution = ({ isGlobalView, cabang, categoryData }) => {
  // Make sure we have data to display
  const categories =
    categoryData && categoryData.length > 0
      ? categoryData.slice(0, 4) // Take top 4 categories
      : [
          { category: "Category 1", value: 5000, percentage: 40 },
          { category: "Category 2", value: 3000, percentage: 25 },
          { category: "Category 3", value: 2000, percentage: 20 },
          { category: "Category 4", value: 1500, percentage: 15 },
        ];

  const totalValue = categories.reduce((sum, cat) => sum + cat.value, 0);

  // Color map for categories - updated with more modern, appealing colors
  const colorMap = {
    0: { bg: "bg-indigo-200", text: "text-indigo-700" },
    1: { bg: "bg-emerald-200", text: "text-emerald-700" },
    2: { bg: "bg-amber-200", text: "text-amber-700" },
    3: { bg: "bg-rose-200", text: "text-rose-700" },
    default: { bg: "bg-slate-200", text: "text-slate-700" },
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium">
          {isGlobalView
            ? "Kategori Produk (Semua Cabang)"
            : `Kategori Produk (${cabang})`}
        </h3>
        <button className="flex items-center text-xs text-gray-500 hover:text-gray-700">
          <span>30 Hari</span>
          <ChevronDown size={14} className="ml-1" />
        </button>
      </div>

      {/* Category Distribution */}
      <div className="h-40 w-full flex flex-col justify-center">
        {categories.map((category, index) => {
          const colorStyle = colorMap[index] || colorMap.default;
          return (
            <div key={category.category} className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-medium ${colorStyle.text}`}>
                  {category.category}
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(category.value)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${colorStyle.bg} transition-all duration-500`}
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Semua Kategori</span>
          <span className="font-medium">{formatCurrency(totalValue)}</span>
        </div>
      </div>
    </div>
  );
};

export default ChartCategoryDistribution;
