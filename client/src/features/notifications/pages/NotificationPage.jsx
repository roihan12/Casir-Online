import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Filter, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useUserNotifications } from "@common/hooks/useUserNotifications";
import { toast } from "react-hot-toast";

const NotificationPage = () => {
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'
  const [page, setPage] = useState(1);
  const limit = 15;

  const {
    useNotifications,
    useMarkAsRead,
    useMarkAllAsRead,
  } = useUserNotifications();

  // Determine API filter parameter
  const apiFilter = filter === "all" ? undefined : filter === "unread" ? false : true;

  const { data: response, isLoading, isError } = useNotifications(
    { isRead: apiFilter },
    page,
    limit
  );

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = response?.data || [];
  const pagination = response?.pagination || { totalPages: 1 };
  const unreadCount = response?.unreadCount || 0;

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getStatusIcon = (type) => {
    // Determine icon based on type (if we had priority, else generic)
    return <Bell size={20} className="text-blue-500" />;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto h-full w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="mr-2 text-indigo-600" />
              Notifikasi Saya
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pantau pemberitahuan terkait izin, slip gaji, dan info personal lainnya
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="flex bg-white border rounded-lg overflow-hidden shadow-sm">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  filter === "all" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => { setFilter("all"); setPage(1); }}
              >
                Semua
              </button>
              <div className="w-px bg-gray-200"></div>
              <button
                className={`px-4 py-2 text-sm font-medium flex items-center ${
                  filter === "unread" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => { setFilter("unread"); setPage(1); }}
              >
                Belum Dibaca
                {unreadCount > 0 && filter !== "unread" && (
                  <span className="ml-1.5 bg-red-100 text-red-600 text-xs py-0.5 px-1.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isLoading || notifications.filter(n => !n.is_read).length === 0}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <CheckCircle size={16} className="mr-2 text-green-500" />
              Tandai Semua Dibaca
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Memuat notifikasi...</p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center text-red-500">
              <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
              <p>Gagal memuat notifikasi. Silakan coba lagi nanti.</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {filter === "unread" ? "Tidak ada notifikasi baru" : "Belum ada notifikasi"}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {filter === "unread" 
                  ? "Anda telah membaca semua notifikasi yang masuk." 
                  : "Anda belum menerima notifikasi apapun di sistem."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div 
                  key={notification.notif_id}
                  className={`p-4 sm:p-5 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-start gap-4 ${
                    !notification.is_read ? 'bg-indigo-50/20 cursor-pointer' : ''
                  }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.notif_id)}
                >
                  <div className={`mt-1 hidden sm:flex h-10 w-10 rounded-full items-center justify-center flex-shrink-0 ${
                    !notification.is_read ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    {getStatusIcon(notification.tipe)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-base sm:text-lg ${!notification.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {notification.judul}
                      </h4>
                      {!notification.is_read && (
                        <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-indigo-600 mt-2 sm:mt-1.5 ml-3 shadow-sm border border-white"></span>
                      )}
                    </div>
                    
                    <p className={`text-sm mb-3 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notification.pesan}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1 opacity-70" />
                        {new Date(notification.created_at).toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} 
                        &nbsp;&bull;&nbsp; 
                        {new Date(notification.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit', 
                          minute:'2-digit'
                        })} WIB
                      </span>
                      
                      {notification.tipe && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 capitalize">
                          {notification.tipe.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Halaman {page} dari {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default NotificationPage;
