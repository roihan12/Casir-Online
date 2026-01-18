# Dokumentasi View Menu dan Role

Dokumen ini berisi penjelasan tentang view SQL yang dibuat untuk menampilkan data menu, role, dan izin akses dalam sistem.

## Daftar View

### 1. View Dasar

#### `vw_menu_hierarchy`
Menampilkan struktur menu dengan hierarki (parent-child) dalam format yang mudah dibaca.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_menu_hierarchy;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_menu_hierarchy WHERE level = 1; -- Hanya menu utama
SELECT * FROM vw_menu_hierarchy WHERE menu_path LIKE '%Pengaturan%'; -- Menu yang terkait dengan Pengaturan
```

#### `vw_role_menu_summary`
Menampilkan daftar role dengan jumlah menu yang dimiliki dan ringkasan izin akses.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_role_menu_summary;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_role_menu_summary WHERE total_menus > 10;
SELECT * FROM vw_role_menu_summary ORDER BY view_permissions DESC;
```

#### `vw_role_menu_permissions`
Menampilkan detail izin akses menu untuk setiap role.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_role_menu_permissions;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_role_menu_permissions WHERE role_id = 'role-id-1';
SELECT * FROM vw_role_menu_permissions WHERE access_level = 'Full Access';
```

#### `vw_available_menu_by_role`
Menampilkan menu yang tersedia untuk setiap role (yang memiliki izin view).

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_available_menu_by_role;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_available_menu_by_role WHERE role_id = 'role-id-1';
SELECT * FROM vw_available_menu_by_role WHERE can_edit = true;
```

#### `vw_unassigned_menu_by_role`
Menampilkan menu yang belum diberikan ke role tertentu.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_unassigned_menu_by_role;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_unassigned_menu_by_role WHERE role_id = 'role-id-1';
```

### 2. View untuk Navigasi

#### `vw_sidebar_navigation`
Menampilkan data menu untuk navigasi sidebar dengan format parent-child.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_sidebar_navigation;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_sidebar_navigation WHERE parent_name = 'Dashboard';
```

#### `vw_role_sidebar_navigation`
Menampilkan data menu untuk navigasi sidebar berdasarkan role.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_role_sidebar_navigation;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_role_sidebar_navigation WHERE role_id = 'role-id-1';
SELECT * FROM vw_role_sidebar_navigation WHERE has_view_permission = true;
```

### 3. View untuk Statistik dan Analisis

#### `vw_menu_usage_statistics`
Menampilkan statistik penggunaan menu berdasarkan role.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_menu_usage_statistics;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_menu_usage_statistics ORDER BY assigned_roles_count DESC LIMIT 10;
```

#### `vw_most_accessed_menu`
Menampilkan menu yang paling banyak diberikan izin akses.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_most_accessed_menu;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_most_accessed_menu WHERE role_count > 3;
```

#### `vw_menu_permission_audit`
Menampilkan riwayat perubahan izin akses menu (audit trail).

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_menu_permission_audit;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_menu_permission_audit WHERE action_type = 'Updated';
SELECT * FROM vw_menu_permission_audit WHERE updated_at > NOW() - INTERVAL '7 days';
```

#### `vw_role_permission_distribution`
Menampilkan distribusi izin akses berdasarkan role.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_role_permission_distribution;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_role_permission_distribution ORDER BY view_percentage DESC;
```

#### `vw_orphaned_menus`
Menampilkan menu yang tidak digunakan (tidak terhubung dengan role manapun).

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_orphaned_menus;
```

#### `vw_frequently_modified_menu_permissions`
Menampilkan menu yang paling sering diubah izin aksesnya.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_frequently_modified_menu_permissions;
```

#### `vw_role_permission_strength`
Menampilkan role dengan izin akses paling banyak.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_role_permission_strength;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_role_permission_strength WHERE permission_strength_percentage > 50;
```

#### `vw_menu_role_system_summary`
Menampilkan ringkasan sistem menu dan role.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_menu_role_system_summary;
```

### 4. View untuk API

#### `vw_menu_json`
Menampilkan data menu dalam format JSON untuk API.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_menu_json;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_menu_json WHERE is_active = true;
```

#### `vw_role_menu_json`
Menampilkan data menu dan izin akses dalam format JSON untuk API berdasarkan role.

**Contoh Penggunaan:**
```sql
SELECT * FROM vw_role_menu_json;
```

**Contoh Penggunaan dengan Filter:**
```sql
SELECT * FROM vw_role_menu_json WHERE role_id = 'role-id-1';
```

## Penggunaan dalam Aplikasi

### Contoh Penggunaan dalam Backend (Node.js dengan Prisma)

```javascript
// Mengambil data menu untuk sidebar berdasarkan role
async function getSidebarMenuByRole(roleId) {
  const result = await prisma.$queryRaw`
    SELECT * FROM vw_role_sidebar_navigation 
    WHERE role_id = ${roleId} AND has_view_permission = true
    ORDER BY parent_order, parent_name, child_order, child_name
  `;
  return result;
}

// Mengambil data menu dalam format JSON untuk API
async function getMenuJsonForApi() {
  const result = await prisma.$queryRaw`
    SELECT * FROM vw_menu_json 
    WHERE is_active = true
    ORDER BY order_index, menu_name
  `;
  return result;
}

// Mengambil data izin akses menu untuk role tertentu
async function getRoleMenuPermissions(roleId) {
  const result = await prisma.$queryRaw`
    SELECT * FROM vw_role_menu_permissions 
    WHERE role_id = ${roleId}
    ORDER BY parent_menu, menu_name
  `;
  return result;
}
```

### Contoh Penggunaan dalam Frontend (React)

```javascript
// Mengambil data menu untuk sidebar berdasarkan role
const useSidebarMenu = (roleId) => {
  return useQuery(['sidebarMenu', roleId], async () => {
    const response = await axios.get(`/api/menu/sidebar/${roleId}`);
    return response.data;
  });
};

// Mengambil data izin akses menu untuk role tertentu
const useRoleMenuPermissions = (roleId) => {
  return useQuery(['roleMenuPermissions', roleId], async () => {
    const response = await axios.get(`/api/role/${roleId}/menu-permissions`);
    return response.data;
  });
};
```

## Catatan Penting

1. Pastikan untuk menjalankan file SQL yang berisi definisi view sebelum menggunakannya.
2. Beberapa view menggunakan fitur PostgreSQL seperti `json_agg` dan `json_build_object`, pastikan database yang digunakan mendukung fitur tersebut.
3. Untuk performa yang lebih baik, pertimbangkan untuk membuat indeks pada kolom yang sering digunakan dalam filter.
4. Beberapa view mungkin perlu disesuaikan dengan struktur database yang ada.

## Pemeliharaan

Jika ada perubahan pada struktur tabel `menu`, `roles`, atau `role_menu`, pastikan untuk memperbarui view yang terkait agar tetap berfungsi dengan baik.