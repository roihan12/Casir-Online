# Sistem View Menu dan Role

Dokumen ini menjelaskan tentang sistem view SQL dan komponen React yang dibuat untuk menampilkan dan mengelola data menu, role, dan izin akses dalam aplikasi.

## Daftar Isi

1. [Struktur View SQL](#struktur-view-sql)
2. [API Endpoints](#api-endpoints)
3. [React Hooks](#react-hooks)
4. [Komponen React](#komponen-react)
5. [Cara Penggunaan](#cara-penggunaan)
6. [Contoh Implementasi](#contoh-implementasi)

## Struktur View SQL

View SQL dibagi menjadi beberapa kategori:

### View Dasar

- `vw_menu_hierarchy`: Menampilkan struktur menu dengan hierarki (parent-child).
- `vw_role_menu_summary`: Menampilkan daftar role dengan jumlah menu yang dimiliki.
- `vw_role_menu_permissions`: Menampilkan detail izin akses menu untuk setiap role.
- `vw_available_menu_by_role`: Menampilkan menu yang tersedia untuk setiap role.
- `vw_unassigned_menu_by_role`: Menampilkan menu yang belum diberikan ke role tertentu.

### View untuk Navigasi

- `vw_sidebar_navigation`: Menampilkan data menu untuk navigasi sidebar.
- `vw_role_sidebar_navigation`: Menampilkan data menu untuk navigasi sidebar berdasarkan role.

### View untuk Statistik dan Analisis

- `vw_menu_usage_statistics`: Menampilkan statistik penggunaan menu berdasarkan role.
- `vw_most_accessed_menu`: Menampilkan menu yang paling banyak diberikan izin akses.
- `vw_menu_permission_audit`: Menampilkan riwayat perubahan izin akses menu (audit trail).
- `vw_role_permission_distribution`: Menampilkan distribusi izin akses berdasarkan role.
- `vw_orphaned_menus`: Menampilkan menu yang tidak digunakan (tidak terhubung dengan role manapun).
- `vw_frequently_modified_menu_permissions`: Menampilkan menu yang paling sering diubah izin aksesnya.
- `vw_role_permission_strength`: Menampilkan role dengan izin akses paling banyak.
- `vw_menu_role_system_summary`: Menampilkan ringkasan sistem menu dan role.

### View untuk API

- `vw_menu_json`: Menampilkan data menu dalam format JSON untuk API.
- `vw_role_menu_json`: Menampilkan data menu dan izin akses dalam format JSON untuk API berdasarkan role.

## API Endpoints

API endpoints untuk mengakses view menu dan role:

- `GET /api/menu-view/hierarchy`: Mendapatkan struktur menu dengan hierarki.
- `GET /api/menu-view/role-summary`: Mendapatkan ringkasan role dan menu.
- `GET /api/menu-view/permissions`: Mendapatkan detail izin akses menu untuk semua role.
- `GET /api/menu-view/permissions/:roleId`: Mendapatkan detail izin akses menu untuk role tertentu.
- `GET /api/menu-view/available/:roleId`: Mendapatkan menu yang tersedia untuk role tertentu.
- `GET /api/menu-view/unassigned/:roleId`: Mendapatkan menu yang belum diberikan ke role tertentu.
- `GET /api/menu-view/sidebar`: Mendapatkan data menu untuk navigasi sidebar.
- `GET /api/menu-view/sidebar/:roleId`: Mendapatkan data menu untuk navigasi sidebar berdasarkan role.
- `GET /api/menu-view/statistics`: Mendapatkan statistik penggunaan menu.
- `GET /api/menu-view/most-accessed`: Mendapatkan menu yang paling banyak diberikan izin akses.
- `GET /api/menu-view/json`: Mendapatkan data menu dalam format JSON untuk API.
- `GET /api/menu-view/json/:roleId`: Mendapatkan data menu dan izin akses dalam format JSON untuk API berdasarkan role.
- `GET /api/menu-view/system-summary`: Mendapatkan ringkasan sistem menu dan role.

## React Hooks

Custom hooks untuk mengakses API menu view:

- `useMenuHierarchy()`: Mendapatkan struktur menu dengan hierarki.
- `useRoleMenuSummary()`: Mendapatkan ringkasan role dan menu.
- `useRoleMenuPermissions(roleId)`: Mendapatkan detail izin akses menu untuk role tertentu.
- `useAvailableMenuByRole(roleId)`: Mendapatkan menu yang tersedia untuk role tertentu.
- `useUnassignedMenuByRole(roleId)`: Mendapatkan menu yang belum diberikan ke role tertentu.
- `useSidebarNavigation()`: Mendapatkan data menu untuk navigasi sidebar.
- `useRoleSidebarNavigation(roleId)`: Mendapatkan data menu untuk navigasi sidebar berdasarkan role.
- `useMenuUsageStatistics()`: Mendapatkan statistik penggunaan menu.
- `useMostAccessedMenu()`: Mendapatkan menu yang paling banyak diberikan izin akses.
- `useMenuJson()`: Mendapatkan data menu dalam format JSON untuk API.
- `useRoleMenuJson(roleId)`: Mendapatkan data menu dan izin akses dalam format JSON untuk API berdasarkan role.
- `useMenuRoleSystemSummary()`: Mendapatkan ringkasan sistem menu dan role.

## Komponen React

Komponen React untuk menampilkan dan mengelola data menu dan role:

- `MenuViewExample`: Komponen untuk menampilkan contoh penggunaan view menu.
- `MenuManagementPage`: Halaman admin untuk mengelola menu dan izin akses.
  - `MenuManagement`: Komponen untuk mengelola menu.
  - `PermissionManagement`: Komponen untuk mengelola izin akses menu.

## Cara Penggunaan

### 1. Instalasi View SQL

Jalankan file SQL yang berisi definisi view di database PostgreSQL:

```bash
psql -U username -d database_name -f server/db/menu_views.sql
psql -U username -d database_name -f server/db/menu_additional_views.sql
psql -U username -d database_name -f server/db/menu_analytics_views.sql
```

### 2. Mendaftarkan API Routes

Tambahkan routes untuk menu view di file `server/src/app.js`:

```javascript
const menuViewRoutes = require('./routes/menuViewRoutes');

// ...

app.use('/api/menu-view', menuViewRoutes);
```

### 3. Mendaftarkan React Routes

Tambahkan routes untuk menu management di file `client/src/routes/index.jsx`:

```javascript
import menuRoutes from './menuRoutes';

// ...

const routes = [
  // ...
  ...menuRoutes,
  // ...
];
```

### 4. Menggunakan Custom Hooks

Contoh penggunaan custom hooks di komponen React:

```javascript
import { useRoleSidebarNavigation } from '../hooks/useMenuView';

const SidebarNavigation = ({ roleId }) => {
  const { data, isLoading, error } = useRoleSidebarNavigation(roleId);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <nav>
      {data.map((parent) => (
        <div key={parent.id}>
          <div>{parent.name}</div>
          <ul>
            {parent.children.map((child) => (
              <li key={child.id}>{child.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};
```

## Contoh Implementasi

### 1. Menampilkan Menu Sidebar Berdasarkan Role

```javascript
import { useRoleSidebarNavigation } from '../hooks/useMenuView';
import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
  const { user } = useAuth();
  const { data, isLoading } = useRoleSidebarNavigation(user?.roleId);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <nav className="bg-gray-800 text-white h-screen w-64 p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Casir Online</h1>
      </div>
      
      <ul>
        {data?.map((parent) => (
          <li key={parent.id} className="mb-2">
            <div className="flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer">
              <div className="flex items-center">
                <span className="mr-3">{parent.icon}</span>
                <span>{parent.name}</span>
              </div>
              {parent.children?.length > 0 && (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
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
  );
};
```

### 2. Menampilkan Statistik Menu di Dashboard Admin

```javascript
import { useMenuRoleSystemSummary, useMostAccessedMenu } from '../hooks/useMenuView';

const MenuStatistics = () => {
  const { data: summary, isLoading: isLoadingSummary } = useMenuRoleSystemSummary();
  const { data: mostAccessed, isLoading: isLoadingMostAccessed } = useMostAccessedMenu();
  
  if (isLoadingSummary || isLoadingMostAccessed) return <div>Loading...</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">System Summary</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{summary?.active_roles}</div>
            <div className="text-sm text-gray-500">Active Roles</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{summary?.active_menus}</div>
            <div className="text-sm text-gray-500">Active Menus</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{summary?.role_menu_assignments}</div>
            <div className="text-sm text-gray-500">Role-Menu Assignments</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">{summary?.view_permissions}</div>
            <div className="text-sm text-gray-500">View Permissions</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Most Accessed Menus</h2>
        
        <ul className="divide-y divide-gray-200">
          {mostAccessed?.map((menu) => (
            <li key={menu.menu_id} className="py-3">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{menu.menu_name}</div>
                  <div className="text-xs text-gray-500">{menu.parent_menu}</div>
                </div>
                <div className="text-sm text-gray-500">{menu.role_count} roles</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

## Kesimpulan

Sistem view menu dan role ini menyediakan cara yang efisien untuk menampilkan dan mengelola data menu, role, dan izin akses dalam aplikasi. Dengan menggunakan view SQL, API endpoints, dan custom hooks React, pengembang dapat dengan mudah mengintegrasikan fitur manajemen menu dan role ke dalam aplikasi.

Untuk informasi lebih lanjut, lihat dokumentasi view SQL di file `server/db/menu_views_documentation.md`.