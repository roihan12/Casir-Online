import React from "react";
import { ArrowLeft, Edit, CheckCircle, XCircle } from "lucide-react";
import { Can } from "@features/common/Can";

const UserDetailHeader = ({ user, onBack, onEdit }) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Detail User: {user.namaLengkap}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Can permission="user:update">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all duration-200 flex items-center font-medium"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </button>
          </Can>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            user.status === "aktif"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {user.status === "aktif" ? (
            <CheckCircle className="h-4 w-4 mr-1.5" />
          ) : (
            <XCircle className="h-4 w-4 mr-1.5" />
          )}
          Status: {user.status === "aktif" ? "Aktif" : "Nonaktif"}
        </span>
      </div>
    </div>
  );
};

export default UserDetailHeader;
