import React, { useState } from 'react';
import { useMenuHierarchy, useRoleMenuSummary, useRoleMenuPermissions, useUnassignedMenuByRole } from '../../hooks/useMenuView';
import MenuViewExample from '../../components/menu/MenuViewExample';
import { FiMenu, FiUsers, FiLock, FiPlus, FiEdit, FiTrash2, FiEye, FiCheckSquare, FiXSquare } from 'react-icons/fi';

/**
 * Halaman admin untuk mengelola menu dan izin akses
 */
const MenuManagementPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Handler untuk mengubah tab yang aktif
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Menu & Permission Management</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`${activeTab === 'dashboard' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FiMenu className="mr-2" /> Dashboard
          </button>
          <button
            onClick={() => handleTabChange('menu')}
            className={`${activeTab === 'menu' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FiMenu className="mr-2" /> Menu Management
          </button>
          <button
            onClick={() => handleTabChange('permissions')}
            className={`${activeTab === 'permissions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FiLock className="mr-2" /> Permission Management
          </button>
        </nav>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === 'dashboard' && <MenuViewExample />}
      
      {activeTab === 'menu' && <MenuManagement />}
      
      {activeTab === 'permissions' && <PermissionManagement />}
    </div>
  );
};

/**
 * Komponen untuk mengelola menu
 */
const MenuManagement = () => {
  const { data: menuHierarchy, isLoading } = useMenuHierarchy();
  const [selectedMenu, setSelectedMenu] = useState(null);
  
  // Handler untuk memilih menu
  const handleSelectMenu = (menu) => {
    setSelectedMenu(menu);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Menu List */}
      <div className="md:col-span-2 bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FiMenu className="mr-2" /> Menu List
          </h2>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center">
            <FiPlus className="mr-2" /> Add Menu
          </button>
        </div>
        
        {isLoading ? (
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuHierarchy?.map((menu) => (
                  <tr 
                    key={menu.menu_id} 
                    className={`${selectedMenu?.menu_id === menu.menu_id ? 'bg-indigo-50' : ''} hover:bg-gray-50 cursor-pointer`}
                    onClick={() => handleSelectMenu(menu)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {menu.level > 1 && (
                              <span className="inline-block mr-2" style={{ marginLeft: `${(menu.level - 1) * 20}px` }}>
                                —
                              </span>
                            )}
                            {menu.menu_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{menu.path || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{menu.level}</td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <FiEdit />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Menu Detail */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiMenu className="mr-2" /> Menu Detail
        </h2>
        
        {selectedMenu ? (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Menu Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                value={selectedMenu.menu_name} 
                readOnly 
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                value={selectedMenu.path || ''} 
                readOnly 
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                value={selectedMenu.icon || ''} 
                readOnly 
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Menu</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                value={selectedMenu.parent_id || 'None'} 
                readOnly 
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Index</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                value={selectedMenu.order_index} 
                readOnly 
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="mt-1">
                {selectedMenu.is_active ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center">
                <FiEdit className="mr-2" /> Edit Menu
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center">
                <FiTrash2 className="mr-2" /> Delete Menu
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FiMenu className="mx-auto text-4xl mb-2" />
            <p>Select a menu to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Komponen untuk mengelola izin akses menu
 */
const PermissionManagement = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const { data: roleMenuSummary, isLoading: isLoadingSummary } = useRoleMenuSummary();
  const { data: roleMenuPermissions, isLoading: isLoadingPermissions } = useRoleMenuPermissions(selectedRole);
  const { data: unassignedMenus, isLoading: isLoadingUnassigned } = useUnassignedMenuByRole(selectedRole);
  
  // Handler untuk mengubah role yang dipilih
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };
  
  return (
    <div>
      {/* Role Selector */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiUsers className="mr-2" /> Select Role
        </h2>
        
        {isLoadingSummary ? (
          <div className="flex justify-center items-center h-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <select
            id="role-select"
            value={selectedRole}
            onChange={handleRoleChange}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select a role</option>
            {roleMenuSummary?.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.display_name || role.nama_role}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {selectedRole && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assigned Menus */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FiLock className="mr-2" /> Menu Permissions
              </h2>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center">
                <FiPlus className="mr-2" /> Assign Menu
              </button>
            </div>
            
            {isLoadingPermissions ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Create</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roleMenuPermissions?.map((permission) => (
                      <tr key={`${permission.role_id}-${permission.menu_id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{permission.menu_name}</div>
                          <div className="text-xs text-gray-500">{permission.parent_menu}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {permission.can_view ? (
                            <FiCheckSquare className="mx-auto text-green-500" />
                          ) : (
                            <FiXSquare className="mx-auto text-red-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {permission.can_create ? (
                            <FiCheckSquare className="mx-auto text-green-500" />
                          ) : (
                            <FiXSquare className="mx-auto text-red-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {permission.can_edit ? (
                            <FiCheckSquare className="mx-auto text-green-500" />
                          ) : (
                            <FiXSquare className="mx-auto text-red-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {permission.can_delete ? (
                            <FiCheckSquare className="mx-auto text-green-500" />
                          ) : (
                            <FiXSquare className="mx-auto text-red-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            <FiEdit />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Unassigned Menus */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMenu className="mr-2" /> Unassigned Menus
            </h2>
            
            {isLoadingUnassigned ? (
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unassignedMenus?.map((menu) => (
                      <tr key={menu.menu_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{menu.menu_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{menu.path || '-'}</td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md flex items-center text-xs">
                            <FiPlus className="mr-1" /> Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagementPage;