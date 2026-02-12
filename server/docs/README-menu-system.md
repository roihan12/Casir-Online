# Sistem Menu dan Role Management

## Deskripsi

Sistem Menu dan Role Management adalah komponen penting dalam aplikasi Casir-Online yang memungkinkan pengelolaan menu navigasi dan hak akses pengguna berdasarkan peran (role). Sistem ini terdiri dari beberapa komponen:

1. **SQL Insert Statements**: Untuk mengisi data awal menu dan role-menu.
2. **SQL Views**: Untuk menampilkan data menu, role, dan izin akses dalam berbagai format.
3. **API Endpoints**: Untuk mengakses data menu dan role dari backend.
4. **React Hooks**: Untuk mengakses API dari frontend.
5. **React Components**: Untuk menampilkan dan mengelola data menu dan role.

## Cara Penggunaan

### 1. Instalasi

#### 1.1. Import SQL Insert Statements

Jalankan SQL insert statements untuk mengisi data awal menu dan role-menu di database PostgreSQL.

#### 1.2. Import SQL Views

Jalankan file SQL yang berisi definisi view di database PostgreSQL:

```bash
psql -U username -d database_name -f server/db/menu_views.sql
psql -U username -d database_name -f server/db/menu_additional_views.sql
psql -U username -d database_name -f server/db/menu_analytics_views.sql
```

#### 1.3. Mendaftarkan API Routes

Tambahkan routes untuk menu view di file `server/src/app.js`:

```javascript
const menuViewRoutes = require('./routes/menuViewRoutes');

// ...

app.use('/api/menu-view', menuViewRoutes);
```

#### 1.4. Mendaftarkan React Routes

Routes untuk menu management sudah didaftarkan di file `client/src/routes/index.jsx`.

### 2. Mengakses Halaman Menu Management

Halaman Menu Management dapat diakses melalui URL `/admin/menu-management`. Halaman ini hanya dapat diakses oleh pengguna dengan role `super_admin`.

### 3. Menggunakan Custom Hooks

Custom hooks untuk mengakses API menu view dapat digunakan di komponen React:

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

## Struktur Sistem

### 1. SQL Views

View SQL dibagi menjadi beberapa kategori:

#### 1.1. View Dasar

- `vw_menu_hierarchy`: Menampilkan struktur menu dengan hierarki (parent-child).
- `vw_role_menu_summary`: Menampilkan daftar role dengan jumlah menu yang dimiliki.
- `vw_role_menu_permissions`: Menampilkan detail izin akses menu untuk setiap role.
- `vw_available_menu_by_role`: Menampilkan menu yang tersedia untuk setiap role.
- `vw_unassigned_menu_by_role`: Menampilkan menu yang belum diberikan ke role tertentu.

#### 1.2. View untuk Navigasi

- `vw_sidebar_navigation`: Menampilkan data menu untuk navigasi sidebar.
- `vw_role_sidebar_navigation`: Menampilkan data menu untuk navigasi sidebar berdasarkan role.

#### 1.3. View untuk Statistik dan Analisis

- `vw_menu_usage_statistics`: Menampilkan statistik penggunaan menu berdasarkan role.
- `vw_most_accessed_menu`: Menampilkan menu yang paling banyak diberikan izin akses.
- `vw_menu_permission_audit`: Menampilkan riwayat perubahan izin akses menu (audit trail).
- `vw_role_permission_distribution`: Menampilkan distribusi izin akses berdasarkan role.
- `vw_orphaned_menus`: Menampilkan menu yang tidak digunakan (tidak terhubung dengan role manapun).
- `vw_frequently_modified_menu_permissions`: Menampilkan menu yang paling sering diubah izin aksesnya.
- `vw_role_permission_strength`: Menampilkan role dengan izin akses paling banyak.
- `vw_menu_role_system_summary`: Menampilkan ringkasan sistem menu dan role.

#### 1.4. View untuk API

- `vw_menu_json`: Menampilkan data menu dalam format JSON untuk API.
- `vw_role_menu_json`: Menampilkan data menu dan izin akses dalam format JSON untuk API berdasarkan role.

### 2. API Endpoints

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

### 3. React Hooks

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

### 4. React Components

Komponen React untuk menampilkan dan mengelola data menu dan role:

- `MenuViewExample`: Komponen untuk menampilkan contoh penggunaan view menu.
- `MenuManagementPage`: Halaman admin untuk mengelola menu dan izin akses.

## Dokumentasi Tambahan

Untuk informasi lebih lanjut, lihat dokumentasi berikut:

- [Menu View System](./docs/menu_view_system.md): Dokumentasi lengkap tentang sistem view menu dan role.
- [Menu Views Documentation](./server/db/menu_views_documentation.md): Dokumentasi lengkap tentang view SQL.

## Kontributor

- Tim Pengembang Casir-Online