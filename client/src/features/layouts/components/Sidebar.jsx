import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useCabang } from '../../cabang/hooks/useCabang';

const Sidebar = ({ menuItems, user, selectedCabang }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    // Close all open submenus when collapsing
    if (!collapsed) {
      setOpenMenus({});
    }
  };

  const toggleSubmenu = (key) => {
    setOpenMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isActive = (link) => {
    return location.pathname === link || location.pathname.startsWith(`${link}/`);
  };

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-8 w-8" 
            />
            <span className="font-bold text-lg">Casir Online</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>

      {selectedCabang && !collapsed && (
        <div className="px-4 py-2 border-b border-gray-200">
          <p className="text-xs text-gray-500">Cabang Aktif</p>
          <p className="font-medium truncate">{selectedCabang.nama}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isMenuActive = isActive(item.link);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isOpen = openMenus[item.key];

            return (
              <div key={item.key} className="space-y-1">
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.key)}
                    className={cn(
                      "flex items-center w-full px-3 py-2 text-sm rounded-md",
                      isMenuActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100",
                      collapsed && "justify-center"
                    )}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      {!collapsed && (
                        <span className="ml-3 flex-1">{item.label}</span>
                      )}
                    </span>
                    {!collapsed && hasSubmenu && (
                      <span className="ml-auto">
                        {isOpen ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </span>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.link}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm rounded-md",
                      isMenuActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100",
                      collapsed && "justify-center"
                    )}
                  >
                    {item.icon}
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </Link>
                )}

                {/* Submenu */}
                {!collapsed && hasSubmenu && isOpen && (
                  <div className="pl-4 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.link}
                        to={subItem.link}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm rounded-md",
                          isActive(subItem.link)
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {subItem.icon}
                        <span className="ml-3">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role || 'Role'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;