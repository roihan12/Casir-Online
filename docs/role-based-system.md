# Sistem Berbasis Peran (Role-Based System)

## Pendahuluan

Dokumen ini menjelaskan implementasi sistem berbasis peran (Role-Based Access Control/RBAC) yang telah diterapkan di aplikasi Kasir Online. Sistem ini memungkinkan pengelolaan akses dan tampilan berdasarkan peran pengguna dengan cara yang fleksibel dan mudah dipelihara.

## Komponen Utama

### 1. Dashboard Universal

Sistem ini menyediakan dashboard universal yang akan ditampilkan jika peran pengguna tidak ada dalam daftar peran yang diizinkan. Implementasi ini terdiri dari beberapa komponen:

- **DefaultDashboard**: Dashboard default yang ditampilkan untuk peran yang tidak memiliki dashboard khusus.
- **DynamicDashboard**: Komponen yang memilih dashboard yang sesuai berdasarkan peran pengguna.
- **UniversalDashboard**: Komponen yang menggabungkan DynamicDashboard dan DefaultDashboard dengan pendekatan yang lebih fleksibel.

### 2. Routing Berbasis Peran

Sistem routing berbasis peran memungkinkan pengelolaan akses ke rute berdasarkan peran pengguna:

- **ProtectedRoute**: Komponen dasar untuk melindungi rute berdasarkan peran pengguna.
- **DynamicRoute**: Komponen yang menangani routing dinamis berdasarkan peran pengguna.
- **RoleBasedRoute**: Komponen yang menggabungkan fungsionalitas ProtectedRoute dan DynamicRoute untuk routing berbasis peran yang lebih fleksibel.

### 3. Komponen Berbasis Peran

Sistem ini juga menyediakan komponen-komponen yang dapat digunakan untuk menampilkan konten berdasarkan peran pengguna:

- **RoleBasedComponent**: Komponen yang merender komponen yang berbeda berdasarkan peran pengguna.
- **RoleBasedContent**: Komponen yang menampilkan konten yang berbeda berdasarkan peran pengguna.
- **RoleBasedPermission**: Komponen yang menampilkan konten berdasarkan peran dan izin pengguna.
- **RoleBasedFeature**: Komponen yang menampilkan fitur berdasarkan peran dan izin pengguna.
- **RoleBasedMenu**: Komponen yang menampilkan menu berdasarkan peran pengguna.

## Cara Penggunaan

### 1. Dashboard Universal

Dashboard universal sudah dikonfigurasi di `routes/index.jsx` dan akan ditampilkan secara otomatis jika peran pengguna tidak ada dalam daftar peran yang diizinkan.

```jsx
// Contoh penggunaan di routes/index.jsx
{
  index: true,
  element: <ProtectedRoute allowedRoles={[]}>
    <UniversalDashboard />
  </ProtectedRoute>
}
```

### 2. Routing Berbasis Peran

#### Menggunakan RoleBasedRoute

```jsx
<RoleBasedRoute 
  roleConfig={{
    'super_admin': { component: SuperAdminComponent, allowedRoles: ['super_admin'] },
    'admin_cabang': { component: AdminCabangComponent, allowedRoles: ['admin_cabang'] },
    'kasir': { component: KasirComponent, allowedRoles: ['kasir'] }
  }}
  fallbackComponent={DefaultComponent}
  fallbackPath="/dashboard"
  strict={false}
/>
```

### 3. Komponen Berbasis Peran

#### Menggunakan RoleBasedContent

```jsx
<RoleBasedContent 
  roleContent={{
    'super_admin': <div>Konten untuk Super Admin</div>,
    'admin_cabang': <div>Konten untuk Admin Cabang</div>,
    'kasir': <div>Konten untuk Kasir</div>
  }}
  fallback={<div>Konten Default</div>}
/>
```

#### Menggunakan RoleBasedPermission

```jsx
<RoleBasedPermission 
  allowedRoles={['super_admin', 'admin_cabang']} 
  requiredPermissions={['user.create']} 
  fallback={<div>Anda tidak memiliki izin</div>}
>
  <div>Konten yang memerlukan izin</div>
</RoleBasedPermission>
```

#### Menggunakan RoleBasedFeature

```jsx
// Definisikan konfigurasi fitur
const features = {
  adminDashboard: {
    component: AdminDashboardComponent,
    allowedRoles: ['super_admin', 'admin_cabang'],
    requiredPermissions: ['dashboard.read'],
    props: { title: 'Admin Dashboard' }
  },
  // ... fitur lainnya
};

// Gunakan RoleBasedFeature
<RoleBasedFeature 
  features={features} 
  featureKey="adminDashboard" 
  fallback={<div>Anda tidak memiliki akses ke fitur ini</div>}
/>
```

## Contoh Halaman

Untuk melihat contoh penggunaan komponen berbasis peran, kunjungi halaman `/features` di aplikasi.

## Pengembangan Lebih Lanjut

Sistem ini dapat dikembangkan lebih lanjut dengan:

1. Menambahkan dukungan untuk izin yang lebih granular.
2. Mengintegrasikan dengan API backend untuk mendapatkan izin dan menu dari database.
3. Menambahkan caching untuk performa yang lebih baik.
4. Menambahkan dukungan untuk peran dan izin yang dinamis.

## Kesimpulan

Sistem berbasis peran ini menyediakan cara yang fleksibel dan mudah dipelihara untuk mengelola akses dan tampilan berdasarkan peran pengguna. Dengan menggunakan komponen-komponen yang disediakan, pengembang dapat dengan mudah menambahkan fitur baru yang memperhitungkan peran dan izin pengguna.