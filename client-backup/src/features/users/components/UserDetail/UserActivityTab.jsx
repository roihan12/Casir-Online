import React, { useState } from "react";
import { Clock, Filter, Calendar, Terminal } from "lucide-react";

const UserActivityTab = ({
  activityLogs,
  isLoading,
  formatDate,
  formatTime,
}) => {
  const [filterType, setFilterType] = useState("all");

  const filteredLogs =
    filterType === "all"
      ? activityLogs
      : activityLogs.filter(
          (log) => log.action?.toLowerCase() === filterType.toLowerCase()
        );

  const logTypes = ["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE"];

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case "login":
        return "bg-green-500 border-green-500";
      case "logout":
        return "bg-gray-400 border-gray-400";
      case "create":
        return "bg-indigo-500 border-indigo-500";
      case "update":
        return "bg-orange-500 border-orange-500";
      case "delete":
        return "bg-red-500 border-red-500";
      default:
        return "bg-blue-500 border-blue-500";
    }
  };

  const parseValues = (jsonString) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return jsonString;
    }
  };

  const renderDetails = (log) => {
    const oldVal = parseValues(log.old_values);
    const newVal = parseValues(log.new_values);

    if (log.action === "UPDATE" && oldVal && newVal) {
      // Find changed keys
      const changes = Object.keys(newVal).filter(
        (key) => JSON.stringify(newVal[key]) !== JSON.stringify(oldVal[key])
      );
      
      if (changes.length === 0) return <p className="text-sm text-gray-500 italic">No changes detected</p>;

      return (
        <div className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-100 font-mono overflow-x-auto">
          {changes.map((key) => (
            <div key={key} className="mb-1 last:mb-0">
              <span className="font-semibold text-gray-600">{key}:</span>{" "}
              <span className="text-red-500 line-through mr-1">
                {JSON.stringify(oldVal[key])}
              </span>{" "}
              <span className="text-green-600">
                {JSON.stringify(newVal[key])}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (log.action === "CREATE" && newVal) {
      return (
         <div className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-100 font-mono overflow-x-auto">
          <div className="mb-1 font-semibold text-gray-600">Created Data:</div>
           {Object.keys(newVal).slice(0, 5).map(key => (
             <div key={key}>
                <span className="text-gray-500">{key}:</span> <span className="text-gray-800">{String(newVal[key]).substring(0, 50)}</span>
             </div>
           ))}
           {Object.keys(newVal).length > 5 && <div className="text-gray-400 italic">...and more</div>}
         </div>
      );
    }
    
    // Fallback for other actions or plain strings
    return null;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Riwayat Aktivitas</h3>
        <div className="relative">
             <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Semua Aktivitas</option>
              {logTypes.map((type) => (
                <option key={type} value={type.toLowerCase()}>
                  {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredLogs && filteredLogs.length > 0 ? (
        <div className="relative">
          {/* Activity Timeline */}
          <div className="border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
            {filteredLogs.map((activity) => (
              <div key={activity.log_id} className="relative pl-8 group">
                {/* Timeline dot */}
                <span
                  className={`absolute -left-[9px] top-1 h-5 w-5 rounded-full border-4 border-white ${getActionColor(activity.action)}`}
                ></span>

                {/* Activity content */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {activity.action} <span className="font-normal text-gray-500">on</span> <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{activity.table_name || "Unknown"}</span>
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">Record ID: {activity.record_id}</p>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 mt-2 sm:mt-0">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(activity.created_at)} &bull; {formatTime(activity.created_at)}
                    </div>
                  </div>

                  {renderDetails(activity)}

                  {activity.ip_address && (
                    <div className="mt-3 flex items-center gap-2">
                       <span className="px-2 py-1 rounded bg-gray-50 border border-gray-100 text-xs text-gray-500 flex items-center">
                          <Terminal className="w-3 h-3 mr-1.5 opacity-70"/>
                          {activity.ip_address}
                       </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Belum ada aktivitas yang tercatat
          </p>
          {filterType !== "all" && (
            <p className="text-sm text-gray-400 mt-1">
              Coba ubah filter untuk melihat aktivitas lain
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserActivityTab;
