import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useAuth } from "@features/auth/hooks/useAuth.js";
import { useUserMenus } from "@common/hooks/useMenus";
import Spinner from "@features/common/Spinner.jsx";


const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { selectedCabang } = useCabang();
  const { user, getUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Expanding/collapsing menu items
  const [expandedMenus, setExpandedMenus] = useState({});

  // Fetch menus from API (permission-based)
  const { data: apiMenus, isLoading, error } = useUserMenus();

  // Get icon component by name
  const getIconComponent = (iconName, size = 18) => {
    if (!iconName) return <LucideIcons.Home size={size} />;
    
    const Icon = LucideIcons[iconName];
    return Icon ? <Icon size={size} /> : <LucideIcons.Home size={size} />;
  };

  // Determine base path based on user role
  const getBasePath = () => {
    return "";
  };

  // Check if a menu item is active
  const isMenuActive = (link) => {
    if (!link) return false;
    return (
      location.pathname === link || location.pathname.startsWith(`${link}/`)
    );
  };

  // Set active menu based on current path
  useEffect(() => {
    const menuItems = getMenuItems();
    const path = location.pathname;

    // Auto-expand the parent menu if a submenu is active
    menuItems.forEach((item) => {
      if (item.submenu) {
        const hasActiveSubmenu = item.submenu.some(
          (submenu) => submenu.link && path.startsWith(submenu.link)
        );

        if (hasActiveSubmenu) {
          setExpandedMenus((prev) => ({ ...prev, [item.key]: true }));
        }
      }
    });
  }, [location.pathname, apiMenus]);

  const toggleMenu = (menuKey, event) => {
    if (event) {
      event.stopPropagation();
    }

    if (collapsed) return;

    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    if (!collapsed) {
      setExpandedMenus({});
    }
  };

  // Navigate to a link
  const handleNavigate = (link, hasSubmenu, menuKey, event) => {
    if (hasSubmenu) {
      toggleMenu(menuKey, event);
      return;
    }

    if (link) {
      navigate(link);
    }
  };

  // Get menu items - uses API data with minimal fallback
  const getMenuItems = () => {
    const basePath = getBasePath();
    
    // If API menus are available, use them (permission-based from server)
    if (apiMenus && apiMenus.length > 0) {
      return apiMenus.map(menu => ({
        key: menu.id,
        label: menu.name,
        icon: getIconComponent(menu.icon),
        link: menu.path,
        submenu: menu.children && menu.children.length > 0
          ? menu.children.map(child => ({
              key: child.id,
              label: child.name,
              icon: getIconComponent(child.icon, 14),
              link: child.path
            }))
          : undefined
      }));
    }
    
    // Minimal fallback - only dashboard when API fails or returns empty
    return [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: <LucideIcons.Home size={18} />,
        link: `${basePath}/dashboard`,
      },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div
      className={`${
        collapsed ? "w-16 lg:w-20" : "w-64"
      } bg-white p-2 md:p-4 flex flex-col h-screen border-r relative transition-all duration-300`}
    >
      {/* Tombol toggle sidebar */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-white border rounded-full p-1 shadow-md z-10"
      >
        {collapsed ? <LucideIcons.ChevronRight size={16} /> : <LucideIcons.ChevronLeft size={16} />}
      </button>

      <div
        className={`flex items-center ${
          collapsed ? "justify-center" : "ml-2"
        } mb-8`}
      >
        <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">K</span>
        </div>
        {!collapsed && (
          <div className="ml-2 overflow-hidden">
            <span className="text-xl font-semibold">KasirKu</span>
            {selectedCabang && (
              <div className="flex items-center text-xs text-gray-500">
                <LucideIcons.MapPin size={10} className="mr-1" />
                <span className="truncate">
                  {selectedCabang.namaCabang || "Kantor Pusat"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scroll-smooth
        scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
        hover:scrollbar-thumb-gray-400
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner size="md" color="primary" />
            <p className="text-sm text-gray-500 mt-2">Memuat menu...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <LucideIcons.AlertCircle className="mx-auto text-red-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Gagal memuat menu</p>
            <p className="text-xs text-gray-500 mt-1">Menggunakan menu default</p>
          </div>
        ) : (
          menuItems.map((item) => (
            <React.Fragment key={item.key}>
              <div
                className={`mb-1 text-gray-500 p-3 rounded-lg flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                  isMenuActive(item.link) ? "bg-indigo-50 text-indigo-600" : ""
                }`}
                onClick={(e) =>
                  handleNavigate(
                    item.link,
                    item.submenu && item.submenu.length > 0,
                    item.key,
                    e
                  )
                }
              >
                <div className="flex items-center">
                  {item.icon}
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </div>
                {!collapsed && item.submenu && item.submenu.length > 0 && (
                  <LucideIcons.ChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedMenus[item.key] ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>

              {item.submenu && expandedMenus[item.key] && !collapsed && (
                <div className="ml-5 mb-2">
                  {item.submenu.map((subItem, index) => (
                    <div
                      key={subItem.key || index}
                      className={`flex items-center py-2 px-3 text-sm hover:text-indigo-600 cursor-pointer rounded-lg ${
                        isMenuActive(subItem.link)
                          ? "text-indigo-600 bg-indigo-50"
                          : "text-gray-500"
                      }`}
                      onClick={() => subItem.link && navigate(subItem.link)}
                    >
                      {subItem.icon}
                      <span className="ml-2">{subItem.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
