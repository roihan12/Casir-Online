import React, { useState } from 'react';
import { useMenuHierarchy, useRoleMenuSummary, useRoleMenuPermissions, useSidebarNavigation, useRoleSidebarNavigation } from '../../hooks/useMenuView';
import { FiMenu, FiChevronDown, FiChevronRight, FiCheck, FiX, FiEye, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';

/**
 * Komponen untuk menampilkan contoh penggunaan view menu
 */
const MenuViewExample = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [activeTab, setActiveTab] = useState('hierarchy');
  
  // Menggunakan custom hooks untuk mendapatkan data
  const { data: menuHierarchy, isLoading: isLoadingHierarchy } = useMenuHierarchy();
  const { data: roleMenuSummary, isLoading: isLoadingSummary } = useRoleMenuSummary();
  const { data: roleMenuPermissions, isLoading: isLoadingPermissions } = useRoleMenuPermissions(selectedRole);
  const { data: sidebarNavigation, isLoading: isLoadingSidebar } = useSidebarNavigation();
  const { data: roleSidebarNavigation, isLoading: isLoadingRoleSidebar } = useRoleSidebarNavigation(selectedRole);
  
  // Handler untuk mengubah role yang dipilih
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };
  
  // Handler untuk mengubah tab yang aktif
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Menu Management Dashboard</h1>
      
      {/* Role Selector */}
      <div className="mb-6">
        <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">Select Role:</label>
        <select
          id="role-select"
          value={selectedRole}
          onChange={handleRoleChange}
          className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Roles</option>
          {roleMenuSummary?.map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {role.display_name || role.nama_role}
            </option>
          ))}
        </select>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('hierarchy')}
            className={`${activeTab === 'hierarchy' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Menu Hierarchy
          </button>
          <button
            onClick={() => handleTabChange('summary')}
            className={`${activeTab === 'summary' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Role Summary
          </button>
          <button
            onClick={() => handleTabChange('permissions')}
            className={`${activeTab === 'permissions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Menu Permissions
          </button>
          <button
            onClick={() => handleTabChange('sidebar')}
            className={`${activeTab === 'sidebar' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Sidebar Preview
          </button>
        </nav>
      </div>
      
      {/* Content based on active tab */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* Menu Hierarchy Tab */}
        {activeTab === 'hierarchy' && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMenu className="mr-2" /> Menu Hierarchy
            </h2>
            {isLoadingHierarchy ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {menuHierarchy?.map((menu) => (
                      <tr key={menu.menu_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {menu.level > 1 && (
                                  <span className="inline-block mr-2" style={{ marginLeft: `${(menu.level - 1) * 20}px` }}>
                                    {menu.level > 1 && <FiChevronRight className="text-gray-400" />}
                                  </span>
                                )}
                                {menu.menu_name}
                              </div>
                              <div className="text-xs text-gray-500">{menu.menu_path}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{menu.path || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{menu.icon || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{menu.level}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{menu.order_index}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {menu.is_active ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Role Summary Tab */}
        {activeTab === 'summary' && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMenu className="mr-2" /> Role Menu Summary
            </h2>
            {isLoadingSummary ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Menus</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Create</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roleMenuSummary?.map((role) => (
                      <tr key={role.role_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.nama_role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.display_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.total_menus}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.view_permissions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.create_permissions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.edit_permissions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.delete_permissions}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {role.status === 'aktif' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Menu Permissions Tab */}
        {activeTab === 'permissions' && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMenu className="mr-2" /> Menu Permissions
            </h2>
            {isLoadingPermissions ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Menu</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Create</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Level</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roleMenuPermissions?.map((permission) => (
                      <tr key={`${permission.role_id}-${permission.menu_id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permission.menu_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{permission.parent_menu}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{permission.path || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {permission.can_view ? (
                            <FiCheck className="mx-auto text-green-500" />
                          ) : (
                            <FiX className="mx-auto text-red-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {permission.can_create ? (
                            <FiCheck className="mx-auto text-green-500" />
                          ) : (
                            <FiX className="mx-auto text-red-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {permission.can_edit ? (
                            <FiCheck className="mx-auto text-green-500" />
                          ) : (
                            <FiX className="mx-auto text-red-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {permission.can_delete ? (
                            <FiCheck className="mx-auto text-green-500" />
                          ) : (
                            <FiX className="mx-auto text-red-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {permission.access_level === 'Full Access' && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Full Access
                            </span>
                          )}
                          {permission.access_level === 'View Only' && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              View Only
                            </span>
                          )}
                          {permission.access_level === 'Partial Access' && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Partial Access
                            </span>
                          )}
                          {permission.access_level === 'No Access' && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              No Access
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Sidebar Preview Tab */}
        {activeTab === 'sidebar' && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMenu className="mr-2" /> Sidebar Navigation Preview
            </h2>
            {isLoadingSidebar || (selectedRole && isLoadingRoleSidebar) ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="w-64 bg-gray-800 text-white rounded-lg shadow-lg">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-medium">Menu Navigation</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedRole ? (
                      <>Role: {roleMenuSummary?.find(r => r.role_id === selectedRole)?.display_name || 'Unknown Role'}</>
                    ) : (
                      'All Menus'
                    )}
                  </p>
                </div>
                <nav className="mt-4">
                  <ul>
                    {(selectedRole ? roleSidebarNavigation : sidebarNavigation)?.map((parent) => (
                      <li key={parent.id} className="mb-2">
                        <div className="flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer">
                          <div className="flex items-center">
                            <span className="mr-3">{parent.icon}</span>
                            <span>{parent.name}</span>
                          </div>
                          {parent.children?.length > 0 && (
                            <FiChevronDown className="text-gray-500" />
                          )}
                        </div>
                        {parent.children?.length > 0 && (
                          <ul className="ml-8 mt-1">
                            {parent.children.map((child) => (
                              <li key={child.id}>
                                <div className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer">
                                  <span className="mr-3">{child.icon}</span>
                                  <span>{child.name}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuViewExample;