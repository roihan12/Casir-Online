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
import { useInventoryNotifications } from "@common/hooks/useInventoryNotifications";
import { useUserNotifications } from "@common/hooks/useUserNotifications";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { Link } from "react-router-dom";

const Header = () => {
  const [showStockNotifications, setShowStockNotifications] = useState(false);
  const [showUserNotifications, setShowUserNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const stockNotificationRef = useRef(null);
  const userNotificationRef = useRef(null);
  const searchRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { selectedCabang } = useCabang();
  const {
    isLoading,
    results,
    searchCategories,
    performSearch,
    handleResultClick,
    navigateToSearchResults,
  } = useSearch();

  // Stock Notifications Hooks
  const {
    useNotifications: useStockNotifications,
    useMarkAsRead: useStockMarkAsRead,
    useMarkAllAsRead: useStockMarkAllAsRead,
  } = useInventoryNotifications();

  const { data: stockNotificationResponse } = useStockNotifications(
    { cabangId: selectedCabang?.id },
    1,
    5
  );
  
  const stockMarkAsReadMutation = useStockMarkAsRead();
  const stockMarkAllAsReadMutation = useStockMarkAllAsRead();

  const stockNotifications = stockNotificationResponse?.data || [];
  const stockUnreadCount = stockNotificationResponse?.pagination?.totalItems || 0;

  // General/HR Notifications Hooks
  const {
    useNotifications: useUserNotifs,
    useMarkAsRead: useUserMarkAsRead,
    useMarkAllAsRead: useUserMarkAllAsRead,
  } = useUserNotifications();

  const { data: userNotificationResponse } = useUserNotifs({ isRead: false }, 1, 5);
  
  const userMarkAsReadMutation = useUserMarkAsRead();
  const userMarkAllAsReadMutation = useUserMarkAllAsRead();

  const userNotifications = userNotificationResponse?.data || [];
  const userUnreadCount = userNotificationResponse?.unreadCount || 0;

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

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length > 2) {
      setShowSearchDropdown(true);
      const handler = setTimeout(() => {
        performSearch(searchQuery, searchCategory);
      }, 500);

      return () => clearTimeout(handler);
    } else {
      setShowSearchDropdown(false);
    }
  }, [searchQuery, searchCategory, performSearch]);

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

  const handleStockMarkAllAsRead = () => {
    stockMarkAllAsReadMutation.mutate(selectedCabang?.id);
  };

  const handleStockMarkAsRead = (id) => {
    stockMarkAsReadMutation.mutate(id);
  };

  const handleUserMarkAllAsRead = () => {
    userMarkAllAsReadMutation.mutate();
  };

  const handleUserMarkAsRead = (id) => {
    userMarkAsReadMutation.mutate(id);
  };

  // Handle click outside untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        stockNotificationRef.current &&
        !stockNotificationRef.current.contains(event.target)
      ) {
        setShowStockNotifications(false);
      }

      if (
        userNotificationRef.current &&
        !userNotificationRef.current.contains(event.target)
      ) {
        setShowUserNotifications(false);
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

  const toggleStockNotifications = () => {
    setShowStockNotifications(!showStockNotifications);
    setShowUserNotifications(false);
  };

  const toggleUserNotifications = () => {
    setShowUserNotifications(!showUserNotifications);
    setShowStockNotifications(false);
  };

  const getStatusIcon = (priority) => {
    switch (priority) {
      case "HIGH":
        return <AlertCircle size={16} className="text-red-500" />;
      case "MEDIUM":
        return <AlertCircle size={16} className="text-yellow-500" />;
      case "LOW":
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
          title: item.namaProduk,
          subtitle: `Stok: ${item.stok} ${item.satuan || ""}`,
          icon: <Tag size={16} className="text-indigo-500" />,
        };
      case "transactions":
        return {
          title: item.nomor_transaksi,
          subtitle: `Total: RP ${item.total_harga?.toLocaleString()}`,
          icon: <FileSpreadsheet size={16} className="text-green-500" />,
        };
      case "customers":
        return {
          title: item.nama,
          subtitle: item.telepon || item.email,
          icon: <User size={16} className="text-blue-500" />,
        };
      case "suppliers":
        return {
          title: item.nama,
          subtitle: item.kontak,
          icon: <Building size={16} className="text-yellow-500" />,
        };
      default:
        return {
          title: item.nama || item.name || item.nomor || "Tanpa Judul",
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

        <div className="relative w-full md:w-80 hidden md:block" ref={searchRef}>
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
        {/* --- STOCK NOTIFICATIONS --- */}
        <div className="relative" ref={stockNotificationRef}>
          <div
            className="cursor-pointer p-1 md:p-1.5 rounded-full hover:bg-gray-100 relative"
            onClick={toggleStockNotifications}
          >
            <Package size={18} className="md:w-5 md:h-5 text-gray-600" />
            {stockUnreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {stockUnreadCount > 9 ? "9+" : stockUnreadCount}
                </span>
              </div>
            )}
          </div>

          {showStockNotifications && (
            <div className="fixed left-1/2 -translate-x-1/2 mt-2 md:absolute md:left-auto md:right-0 md:translate-x-0 top-14 md:top-10 bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] rounded-lg z-50 w-[90vw] sm:w-[320px] md:w-80 py-2 border">
              <div className="px-4 py-2 border-b flex justify-between items-center">
                <p className="text-sm font-medium">Notifikasi Stok</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleStockMarkAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    disabled={stockMarkAllAsReadMutation.isLoading}
                  >
                    Tandai semua dibaca
                  </button>
                  <X
                    size={16}
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={() => setShowStockNotifications(false)}
                  />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {stockNotifications.length > 0 ? (
                  stockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? "bg-indigo-50/30" : ""
                      }`}
                      onClick={() => !notification.isRead && handleStockMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          {getStatusIcon(notification.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm ${!notification.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-gray-400">
                              <Clock size={10} className="mr-1" />
                              <span className="text-[10px]">
                                {new Date(notification.createdAt).toLocaleString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <Package size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Stok aman terkendali</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 border-t">
                <Link to="/inventory/notifications" onClick={() => setShowStockNotifications(false)} className="w-full text-center text-sm text-blue-600 hover:text-blue-800 block">
                  Lihat semua peringatan stok
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* --- GENERAL/HR NOTIFICATIONS --- */}
        <div className="relative" ref={userNotificationRef}>
          <div
            className="cursor-pointer p-1 md:p-1.5 rounded-full hover:bg-gray-100 relative"
            onClick={toggleUserNotifications}
          >
            <Bell size={18} className="md:w-5 md:h-5 text-gray-600" />
            {userUnreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {userUnreadCount > 9 ? "9+" : userUnreadCount}
                </span>
              </div>
            )}
          </div>

          {showUserNotifications && (
            <div className="fixed left-1/2 -translate-x-1/2 mt-2 md:absolute md:left-auto md:right-0 md:translate-x-0 top-14 md:top-10 bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] rounded-lg z-50 w-[90vw] sm:w-[320px] md:w-80 py-2 border">
              <div className="px-4 py-2 border-b flex justify-between items-center">
                <p className="text-sm font-medium">Notifikasi</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleUserMarkAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    disabled={userMarkAllAsReadMutation.isLoading}
                  >
                    Tandai semua dibaca
                  </button>
                  <X
                    size={16}
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={() => setShowUserNotifications(false)}
                  />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {userNotifications.length > 0 ? (
                  userNotifications.map((notification) => (
                    <div
                      key={notification.notif_id}
                      className={`px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.is_read ? "bg-indigo-50/30" : ""
                      }`}
                      onClick={() => !notification.is_read && handleUserMarkAsRead(notification.notif_id)}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          <Bell size={16} className="text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm ${!notification.is_read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                            {notification.judul}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.pesan}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-gray-400">
                              <Clock size={10} className="mr-1" />
                              <span className="text-[10px]">
                                {new Date(notification.created_at).toLocaleString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 border-t">
                <Link to="/notifications" onClick={() => setShowUserNotifications(false)} className="w-full text-center text-sm text-blue-600 hover:text-blue-800 block">
                  Lihat semua notifikasi
                </Link>
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
