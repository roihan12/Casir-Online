import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useSearch from "../hooks/useSearch";
import {
  Search,
  Tag,
  FileSpreadsheet,
  User,
  Building,
  Package,
  FileBarChart,
  UserCog,
  Settings,
  Loader2,
  ChevronDown,
  Filter,
} from "lucide-react";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const [activeFilters, setActiveFilters] = useState({});
  const [activeTab, setActiveTab] = useState(category);
  const {
    isLoading,
    results,
    searchCategories,
    performSearch,
    handleResultClick,
  } = useSearch();

  useEffect(() => {
    if (query) {
      performSearch(query, category);
    }
  }, [query, category]);

  // Get category icon
  const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
      case "products":
        return <Tag size={20} className="text-indigo-500" />;
      case "transactions":
        return <FileSpreadsheet size={20} className="text-green-500" />;
      case "customers":
        return <User size={20} className="text-blue-500" />;
      case "suppliers":
        return <Building size={20} className="text-yellow-500" />;
      case "inventory":
        return <Package size={20} className="text-purple-500" />;
      case "financial":
        return <FileBarChart size={20} className="text-red-500" />;
      case "users":
        return <UserCog size={20} className="text-gray-500" />;
      case "branches":
        return <Building size={20} className="text-teal-500" />;
      case "settings":
        return <Settings size={20} className="text-gray-500" />;
      default:
        return <Search size={20} className="text-gray-500" />;
    }
  };

  // Format search result item
  const formatResultItem = (item) => {
    switch (item.category) {
      case "products":
        return {
          title: item.name,
          subtitle: `Stok: ${item.stock}`,
          icon: <Tag size={20} className="text-indigo-500" />,
        };
      case "transactions":
        return {
          title: item.number,
          subtitle: `Tanggal: ${item.date}`,
          icon: <FileSpreadsheet size={20} className="text-green-500" />,
        };
      case "customers":
        return {
          title: item.name,
          subtitle: item.email,
          icon: <User size={20} className="text-blue-500" />,
        };
      case "suppliers":
        return {
          title: item.name,
          subtitle: item.contact,
          icon: <Building size={20} className="text-yellow-500" />,
        };
      case "inventory":
        return {
          title: item.name,
          subtitle: `Tanggal: ${item.date}`,
          icon: <Package size={20} className="text-purple-500" />,
        };
      case "financial":
        return {
          title: item.name,
          subtitle: `Tanggal: ${item.date}`,
          icon: <FileBarChart size={20} className="text-red-500" />,
        };
      case "users":
        return {
          title: item.name,
          subtitle: `Role: ${item.role}`,
          icon: <UserCog size={20} className="text-gray-500" />,
        };
      case "branches":
        return {
          title: item.name,
          subtitle: item.address,
          icon: <Building size={20} className="text-teal-500" />,
        };
      case "settings":
        return {
          title: item.name,
          subtitle: "",
          icon: <Settings size={20} className="text-gray-500" />,
        };
      default:
        return {
          title: item.name || "Untitled",
          subtitle: "",
          icon: <Search size={20} className="text-gray-500" />,
        };
    }
  };

  // Function to get available filter options based on the current category
  const getFilterOptions = (categoryId) => {
    switch (categoryId) {
      case "products":
        return {
          stock: {
            label: "Status Stok",
            options: [
              { id: "in-stock", label: "Tersedia" },
              { id: "low-stock", label: "Stok Menipis" },
              { id: "out-of-stock", label: "Habis" },
            ],
          },
        };
      case "transactions":
        return {
          status: {
            label: "Status",
            options: [
              { id: "completed", label: "Selesai" },
              { id: "pending", label: "Tertunda" },
              { id: "canceled", label: "Dibatalkan" },
            ],
          },
          date: {
            label: "Tanggal",
            options: [
              { id: "today", label: "Hari Ini" },
              { id: "yesterday", label: "Kemarin" },
              { id: "this-week", label: "Minggu Ini" },
              { id: "this-month", label: "Bulan Ini" },
            ],
          },
        };
      default:
        return {};
    }
  };

  // Toggle a filter option
  const toggleFilter = (filterCategory, optionId) => {
    setActiveFilters((prev) => {
      // If filter category doesn't exist yet, create it
      if (!prev[filterCategory]) {
        return {
          ...prev,
          [filterCategory]: [optionId],
        };
      }

      // If option is already active, remove it
      if (prev[filterCategory].includes(optionId)) {
        const newOptions = prev[filterCategory].filter((id) => id !== optionId);

        // If no options left in this category, remove the category
        if (newOptions.length === 0) {
          const { [filterCategory]: _, ...rest } = prev;
          return rest;
        }

        // Otherwise update the options
        return {
          ...prev,
          [filterCategory]: newOptions,
        };
      }

      // Add the option to the active filters
      return {
        ...prev,
        [filterCategory]: [...prev[filterCategory], optionId],
      };
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">
          Hasil Pencarian: "{query}"
        </h1>
        <p className="text-gray-600">
          {!isLoading && Object.values(results).flat().length} hasil ditemukan
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar/Categories */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="font-medium mb-3">Kategori</h2>
            <div className="space-y-1">
              {searchCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`w-full flex items-center px-3 py-2 rounded text-left ${
                    activeTab === cat.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-2">{getCategoryIcon(cat.id)}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters - Only show for category specific view */}
          {activeTab !== "all" && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
              <h2 className="font-medium mb-3">Filter</h2>
              {Object.entries(getFilterOptions(activeTab)).map(
                ([filterId, filter]) => (
                  <div key={filterId} className="mb-4">
                    <h3 className="text-sm text-gray-600 mb-2">
                      {filter.label}
                    </h3>
                    <div className="space-y-1">
                      {filter.options.map((option) => (
                        <div key={option.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`filter-${filterId}-${option.id}`}
                            checked={
                              activeFilters[filterId]?.includes(option.id) ||
                              false
                            }
                            onChange={() => toggleFilter(filterId, option.id)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label
                            htmlFor={`filter-${filterId}-${option.id}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={40} className="animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Results for "All" tab show categories */}
              {activeTab === "all" ? (
                Object.entries(results).map(([catId, items]) => (
                  <div
                    key={catId}
                    className="bg-white rounded-lg shadow-sm border overflow-hidden"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                      <div className="flex items-center">
                        {getCategoryIcon(catId)}
                        <h2 className="font-medium ml-2">
                          {searchCategories.find((c) => c.id === catId)?.label}
                        </h2>
                      </div>
                      <span className="text-sm text-gray-500">
                        {items.length} hasil
                      </span>
                    </div>
                    <div>
                      {items.map((item) => {
                        const formattedItem = formatResultItem(item);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleResultClick(item)}
                            className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer flex items-center"
                          >
                            <div className="mr-3">{formattedItem.icon}</div>
                            <div>
                              <p className="font-medium">
                                {formattedItem.title}
                              </p>
                              {formattedItem.subtitle && (
                                <p className="text-sm text-gray-500">
                                  {formattedItem.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                // Results for specific category
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                    <div className="flex items-center">
                      {getCategoryIcon(activeTab)}
                      <h2 className="font-medium ml-2">
                        {
                          searchCategories.find((c) => c.id === activeTab)
                            ?.label
                        }
                      </h2>
                    </div>

                    <div className="flex items-center">
                      <button className="text-sm flex items-center text-gray-700 bg-white border rounded px-3 py-1 hover:bg-gray-50">
                        <Filter size={14} className="mr-1" />
                        <span>Filter</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    {results[activeTab]?.length > 0 ? (
                      results[activeTab].map((item) => {
                        const formattedItem = formatResultItem(item);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleResultClick(item)}
                            className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer flex items-center"
                          >
                            <div className="mr-3">{formattedItem.icon}</div>
                            <div>
                              <p className="font-medium">
                                {formattedItem.title}
                              </p>
                              {formattedItem.subtitle && (
                                <p className="text-sm text-gray-500">
                                  {formattedItem.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center text-gray-500">
                        Tidak ada hasil untuk "{query}" dalam kategori{" "}
                        {
                          searchCategories.find((c) => c.id === activeTab)
                            ?.label
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
