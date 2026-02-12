import React from "react";
import { Store, User, LogOut, Settings, HelpCircle, ShoppingCart } from "lucide-react";

const POSHeader = ({ 
  branchName,
  userName,
  onOpenHelp,
  onOpenSettings,
  onLogout,
  cartItemCount 
}) => {
  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Store className="text-indigo-600" size={24} />
          <h1 className="text-xl font-bold text-gray-800">Point of Sale</h1>
        </div>
        {branchName && (
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
            {branchName}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Cart indicator */}
        {cartItemCount > 0 && (
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full">
            <ShoppingCart size={18} />
            <span className="font-medium">{cartItemCount} item</span>
          </div>
        )}

        {/* User info */}
        {userName && (
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg">
            <User size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{userName}</span>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={onOpenHelp}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Keyboard Shortcuts (F1)"
        >
          <HelpCircle size={20} className="text-gray-600" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Settings"
        >
          <Settings size={20} className="text-gray-600" />
        </button>

        <button
          onClick={onLogout}
          className="p-2 hover:bg-red-50 rounded-lg transition"
          title="Logout"
        >
          <LogOut size={20} className="text-red-600" />
        </button>
      </div>
    </header>
  );
};

export default POSHeader;