import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useAuth } from "@features/auth/hooks/useAuth.js";
import { useUserMenus } from "@common/hooks/useMenus";
import Spinner from "@features/common/Spinner.jsx";


const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { selectedCabang } = useCabang();
  const { user, getUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Expanding/collapsing menu items
  const [expandedMenus, setExpandedMenus] = useState({});

  // Fetch menus from API (permission-based)
  const { data: apiMenus, isLoading, error } = useUserMenus();

  // Listen for resize to determine mobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint in Tailwind is 768px
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true); // Default to collapsed (hidden) on mobile
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for custom event from Header to open/close sidebar on mobile
  useEffect(() => {
    const handleMobileToggle = () => {
      setCollapsed(prev => !prev);
    };
    
    window.addEventListener("toggleMobileSidebar", handleMobileToggle);
    return () => window.removeEventListener("toggleMobileSidebar", handleMobileToggle);
  }, []);

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

    if (collapsed && !isMobile) return;

    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    if (!collapsed && !isMobile) {
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
      // Auto-close on mobile after successful navigation
      if (isMobile) {
        setCollapsed(true);
      }
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
    <>
      {/* Mobile Overlay / Backdrop */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Wrapper */}
      <div
        className={`
          ${isMobile ? "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out" : "relative transition-all duration-300"}
          ${isMobile ? (collapsed ? "-translate-x-full" : "translate-x-0") : ""}
          ${!isMobile ? (collapsed ? "w-16 lg:w-20" : "w-64") : "w-64"}
          bg-white p-2 md:p-4 flex flex-col h-screen text-gray-700 border-r border-gray-200 shadow-sm
        `}
      >
        {/* Tombol toggle sidebar (Chevron) - Sembunyikan di Mobile */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex absolute -right-3 top-20 bg-white text-gray-500 border border-gray-200 rounded-full p-1 shadow-sm z-10 transition-colors hover:bg-gray-50 hover:text-indigo-600"
        >
          {collapsed ? <LucideIcons.ChevronRight size={16} /> : <LucideIcons.ChevronLeft size={16} />}
        </button>

        {/* Header Logo */}
        <div
          className={`flex items-center ${
            collapsed && !isMobile ? "justify-center" : "ml-2"
          } mb-8 relative pt-2 md:pt-0`}
        >
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <LucideIcons.Store size={18} className="text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="ml-3 overflow-hidden flex-1">
              <span className="text-xl font-bold text-gray-900 tracking-tight">Casir Online</span>
              {selectedCabang && (
                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                  <LucideIcons.MapPin size={10} className="mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {selectedCabang.namaCabang || "Kantor Pusat"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Close button inside sidebar on mobile */}
          {isMobile && (
            <button 
              onClick={() => setCollapsed(true)}
              className="absolute -right-2 top-0 text-gray-400 hover:text-gray-700 p-2"
            >
              <LucideIcons.X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto scroll-smooth
          scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent
          hover:scrollbar-thumb-gray-300
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-200
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:hover:bg-gray-300">
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
                  className={`mb-1 p-3 rounded-lg flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${
                    isMenuActive(item.link) ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:text-gray-900"
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
                    {(!collapsed || isMobile) && <span className="ml-3">{item.label}</span>}
                  </div>
                  {(!collapsed || isMobile) && item.submenu && item.submenu.length > 0 && (
                    <LucideIcons.ChevronDown
                      size={16}
                      className={`transition-transform ${
                        expandedMenus[item.key] ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>

                {item.submenu && expandedMenus[item.key] && (!collapsed || isMobile) && (
                  <div className="ml-5 mb-2">
                    {item.submenu.map((subItem, index) => (
                      <div
                        key={subItem.key || index}
                        className={`flex items-center py-2 px-3 text-sm cursor-pointer rounded-lg transition-colors ${
                          isMenuActive(subItem.link)
                            ? "text-indigo-700 bg-indigo-50 font-medium shadow-[inset_2px_0_0_0_#4f46e5]"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          if (subItem.link) {
                            navigate(subItem.link);
                            if (isMobile) setCollapsed(true);
                          }
                        }}
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
    </>
  );
};

export default Sidebar;

