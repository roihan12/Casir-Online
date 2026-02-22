import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Menu,
  Bell,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ShoppingBag,
  FileText,
  ChevronDown,
  Loader2,
  Tag,
  User,
  Building,
  Package,
  FileBarChart,
  Settings,
  UserCog,
  FileSpreadsheet,
} from "lucide-react";
import CabangSwitcher from "@features/cabang/components/CabangSwitcher";
import useSearch from "@common/hooks/useSearch";

const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const notificationRef = useRef(null);
  const searchRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    isLoading,
    results,
    searchCategories,
    performSearch,
    handleResultClick,
    navigateToSearchResults,
  } = useSearch();

  // Format tanggal dalam Bahasa Indonesia
  const formatDate = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("id-ID", options);
  };

  // Format waktu dengan jam:menit:detik
  const formatTime = (date) => {
    return (
      date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB"
    );
  };

  // Update waktu setiap detik
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timerId);
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      setShowSearchDropdown(true);
      // Debounce search
      const handler = setTimeout(() => {
        performSearch(query, searchCategory);
      }, 300);

      return () => {
        clearTimeout(handler);
      };
    } else if (query.length === 0) {
      setShowSearchDropdown(false);
    }
  };

  // Handle search category change
  const handleCategoryChange = (category) => {
    setSearchCategory(category);
    if (searchQuery.length > 2) {
      performSearch(searchQuery, category);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigateToSearchResults(searchQuery, searchCategory);
      setShowSearchDropdown(false);
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case "products":
        return <Tag size={16} />;
      case "transactions":
        return <FileSpreadsheet size={16} />;
      case "customers":
        return <User size={16} />;
      case "suppliers":
        return <Building size={16} />;
      case "inventory":
        return <Package size={16} />;
      case "financial":
        return <FileBarChart size={16} />;
      case "users":
        return <UserCog size={16} />;
      case "branches":
        return <Building size={16} />;
      case "settings":
        return <Settings size={16} />;
      default:
        return <Search size={16} />;
    }
  };

  // Dummy notifications
  const dummyNotifications = [
    {
      id: 1,
      title: "Transaksi Berhasil",
      message: "Transaksi #TRX-21092 telah berhasil diproses",
      time: "10 menit yang lalu",
      status: "success",
    },
    {
      id: 2,
      title: "Stok Menipis",
      message: "Stok produk Keyboard Logitech K380 hampir habis (2 tersisa)",
      time: "1 jam yang lalu",
      status: "warning",
    },
    {
      id: 3,
      title: "Pembayaran Tertunda",
      message: "Transaksi #TRX-21088 menunggu verifikasi pembayaran",
      time: "3 jam yang lalu",
      status: "pending",
    },
  ];

  // Handle click outside untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle size={16} className="text-green-500" />;
      case "warning":
        return <AlertCircle size={16} className="text-yellow-500" />;
      case "pending":
        return <Clock size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  // Format search result for display
  const formatResultItem = (item) => {
    switch (item.category) {
      case "products":
        return {
          title: item.name,
          subtitle: `Stok: ${item.stock}`,
          icon: <Tag size={16} className="text-indigo-500" />,
        };
      case "transactions":
        return {
          title: item.number,
          subtitle: `Tanggal: ${item.date}`,
          icon: <FileSpreadsheet size={16} className="text-green-500" />,
        };
      case "customers":
        return {
          title: item.name,
          subtitle: item.email,
          icon: <User size={16} className="text-blue-500" />,
        };
      case "suppliers":
        return {
          title: item.name,
          subtitle: item.contact,
          icon: <Building size={16} className="text-yellow-500" />,
        };
      case "inventory":
        return {
          title: item.name,
          subtitle: `Tanggal: ${item.date}`,
          icon: <Package size={16} className="text-purple-500" />,
        };
      case "financial":
        return {
          title: item.name,
          subtitle: `Tanggal: ${item.date}`,
          icon: <FileBarChart size={16} className="text-red-500" />,
        };
      case "users":
        return {
          title: item.name,
          subtitle: `Role: ${item.role}`,
          icon: <UserCog size={16} className="text-gray-500" />,
        };
      case "branches":
        return {
          title: item.name,
          subtitle: item.address,
          icon: <Building size={16} className="text-teal-500" />,
        };
      case "settings":
        return {
          title: item.name,
          subtitle: "",
          icon: <Settings size={16} className="text-gray-500" />,
        };
      default:
        return {
          title: item.name || "Untitled",
          subtitle: "",
          icon: <Search size={16} className="text-gray-500" />,
        };
    }
  };

  return (
    <header className="bg-white p-2 md:p-4 flex items-center justify-between border-b">
      <div className="flex items-center flex-1 min-w-0">
        {/* Mobile Sidebar Toggle Button */}
        <button
          type="button"
          className="md:hidden mr-2 p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
          onClick={() => window.dispatchEvent(new Event("toggleMobileSidebar"))}
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full md:w-80" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <div className="flex">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Cari..."
                  className="pl-10 pr-2 md:pr-4 py-1.5 md:py-2 bg-gray-100 rounded-l-lg text-xs md:text-sm w-full focus:outline-none"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() =>
                    searchQuery.length > 0 && setShowSearchDropdown(true)
                  }
                />
              </div>
              <button
                type="button"
                className="bg-gray-100 border-l border-gray-200 rounded-r-lg px-2 md:px-3 flex items-center"
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
              >
                <span className="text-xs md:text-sm text-gray-600 hidden sm:inline mr-1">
                  {
                    searchCategories.find((cat) => cat.id === searchCategory)
                      ?.label
                  }
                </span>
                <ChevronDown size={14} className="md:w-4 md:h-4 text-gray-500" />
              </button>
            </div>
          </form>

          {showSearchDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-96 overflow-auto">
              <div className="p-2 border-b">
                <p className="text-xs font-medium text-gray-500">
                  Kategori Pencarian
                </p>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {searchCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`px-3 py-1.5 rounded text-sm cursor-pointer flex items-center ${
                        searchCategory === category.id
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {getCategoryIcon(category.id)}
                      <span className="ml-2">{category.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {searchQuery.length > 0 && (
                <div className="p-2 border-b">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Hasil Pencarian
                  </p>

                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2
                        size={20}
                        className="animate-spin text-indigo-500"
                      />
                    </div>
                  ) : (
                    <>
                      {Object.keys(results).length > 0 ? (
                        <div>
                          {Object.entries(results).map(([category, items]) => (
                            <div key={category} className="mb-2">
                              <p className="text-xs font-medium text-gray-500 px-2 py-1 bg-gray-50">
                                {
                                  searchCategories.find(
                                    (cat) => cat.id === category
                                  )?.label
                                }
                              </p>
                              {items.map((item) => {
                                const formattedItem = formatResultItem(item);
                                return (
                                  <div
                                    key={item.id}
                                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                                    onClick={() => handleResultClick(item)}
                                  >
                                    <div className="mr-3">
                                      {formattedItem.icon}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {formattedItem.title}
                                      </p>
                                      {formattedItem.subtitle && (
                                        <p className="text-xs text-gray-500">
                                          {formattedItem.subtitle}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-center py-4 text-gray-500">
                          Tidak ada hasil untuk "{searchQuery}"
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="p-2 border-t">
                <button
                  className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm rounded flex items-center justify-center"
                  onClick={handleSearchSubmit}
                >
                  <Search size={14} className="mr-1" />
                  Cari "{searchQuery}" di{" "}
                  {searchCategories
                    .find((cat) => cat.id === searchCategory)
                    ?.label.toLowerCase()}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - Hidden on mobile and small tablets */}
        <div className="ml-2 md:ml-4 hidden lg:block">
          <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-lg">
            <button
              className="flex items-center justify-center h-9 w-9 bg-white rounded hover:bg-indigo-50 text-gray-600 hover:text-indigo-600"
              title="Transaksi Baru"
            >
              <DollarSign size={18} />
            </button>
            <button
              className="flex items-center justify-center h-9 w-9 bg-white rounded hover:bg-indigo-50 text-gray-600 hover:text-indigo-600"
              title="Tambah Produk"
            >
              <ShoppingBag size={18} />
            </button>
            <button
              className="flex items-center justify-center h-9 w-9 bg-white rounded hover:bg-indigo-50 text-gray-600 hover:text-indigo-600"
              title="Laporan"
            >
              <FileText size={18} />
            </button>
          </div>
        </div>

        {/* Date & Time moved from left side */}
      </div>

      <div className="flex items-center space-x-1 md:space-x-4 flex-shrink-0">
        <div className="relative" ref={notificationRef}>
          <div
            className="cursor-pointer p-1 md:p-1.5 rounded-full hover:bg-gray-100"
            onClick={toggleNotifications}
          >
            <Bell size={18} className="md:w-5 md:h-5 text-gray-600" />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">3</span>
            </div>
          </div>

          {showNotifications && (
            <div className="absolute right-0 top-10 bg-white shadow-lg rounded-lg z-10 w-[calc(100vw-2rem)] md:w-80 py-2 border">
              <div className="px-4 py-2 border-b flex justify-between items-center">
                <p className="text-sm font-medium">Notifikasi</p>
                <div className="flex space-x-2">
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    Tandai sudah dibaca
                  </button>
                  <X
                    size={16}
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={() => setShowNotifications(false)}
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {dummyNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        {getStatusIcon(notification.status)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2">
                          <Clock size={12} className="text-gray-400 mr-1" />
                          <span className="text-xs text-gray-400">
                            {notification.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t">
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                  Lihat semua notifikasi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Date & Time - Hidden on mobile */}
        <div className="hidden md:flex items-center text-gray-600">
          <Clock size={18} className="mr-2 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {formatDate(currentTime)}
            </span>
            <span className="text-xs">{formatTime(currentTime)}</span>
          </div>
        </div>

        <CabangSwitcher />
      </div>
    </header>
  );
};

export default Header;
