import React from "react";
import { Star } from "lucide-react";

const CategoriesSection = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  categoryColors,
  showFrequentProducts,
  fetchFrequentProducts,
}) => {
  return (
    <div className="bg-gray-50/50 border-b border-gray-100 px-4 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
      <button
        onClick={() => setSelectedCategory(null)}
        className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
          selectedCategory === null && !showFrequentProducts
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
        }`}
      >
        Semua Produk
      </button>

      <button
        onClick={fetchFrequentProducts}
        className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
          showFrequentProducts
            ? "bg-amber-500 text-white shadow-lg shadow-amber-200 scale-105"
            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
        }`}
      >
        <Star size={16} fill={showFrequentProducts ? "white" : "transparent"} strokeWidth={2.5} />
        Favorit
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setSelectedCategory(category.id)}
          className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            selectedCategory === category.id
              ? "bg-white text-indigo-700 border-2 border-indigo-600 shadow-sm scale-105"
              : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
          }`}
        >
          {category.namaKategori}
        </button>
      ))}
    </div>
  );
};

export default CategoriesSection;