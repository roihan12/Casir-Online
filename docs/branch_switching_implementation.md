# Implementasi Fitur Perpindahan Cabang

## Latar Belakang

Sebelumnya, fitur perpindahan cabang untuk pengguna `super_admin` bergantung pada struktur route yang berbeda per role (misalnya `/admincabang/dashboard` atau `/superadmin/dashboard`). Dengan perubahan struktur route menjadi lebih sederhana (misalnya `/dashboard` saja), diperlukan implementasi baru yang tidak bergantung pada struktur route.

## Implementasi Baru

Implementasi baru untuk fitur perpindahan cabang memiliki beberapa keunggulan:

1. **Tidak bergantung pada struktur route**
   - Tidak perlu lagi menggunakan path berbeda seperti `/admincabang/` atau `/superadmin/`
   - Semua role menggunakan path yang sama (misalnya `/dashboard`)

2. **Persistensi pilihan cabang**
   - Menggunakan `localStorage` untuk menyimpan pilihan cabang
   - Pilihan cabang tetap bertahan setelah refresh halaman

3. **Komunikasi antar komponen**
   - Menggunakan `CustomEvent` untuk memberi tahu komponen lain tentang perubahan cabang
   - Tidak perlu refresh halaman atau perubahan route

4. **Rendering dinamis**
   - `DynamicLayout` akan merender layout yang sesuai berdasarkan `selectedCabang` dan `isGlobalView`
   - Perubahan layout terjadi secara instan tanpa perlu refresh halaman

## Komponen Utama

### 1. CabangContext.jsx

```jsx
// Fungsi untuk mengganti cabang yang dipilih - Implementasi baru
const switchCabang = (cabangId) => {
  // ... validasi dan pencarian cabang ...
  
  // Simpan cabang yang dipilih ke localStorage untuk persistensi
  try {
    localStorage.setItem('selectedCabangId', cabangId);
    localStorage.setItem('isGlobalView', JSON.stringify(isGlobal));
  } catch (err) {
    console.error('Error saving cabang selection to localStorage:', err);
  }
  
  // Update state
  setSelectedCabang(cabangWithGlobalFlag);
  setIsGlobalView(isGlobal);

  // Trigger custom event untuk memberi tahu komponen lain
  const cabangSwitchEvent = new CustomEvent('cabangSwitch', { 
    detail: { 
      cabang: cabangWithGlobalFlag,
      isGlobalView: isGlobal 
    } 
  });
  window.dispatchEvent(cabangSwitchEvent);
};
```

### 2. DynamicLayout.jsx

```jsx
const DynamicLayout = () => {
  const { getUserRole } = useAuth();
  const { selectedCabang, isGlobalView } = useCabang();
  const userRole = getUserRole();
  // State untuk memaksa render ulang komponen
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Listener untuk event cabangSwitch
  useEffect(() => {
    const handleCabangSwitch = () => {
      // Memaksa render ulang komponen
      setForceUpdate(prev => prev + 1);
    };
    
    // Daftarkan event listener
    window.addEventListener('cabangSwitch', handleCabangSwitch);
    
    // Cleanup event listener saat komponen unmount
    return () => {
      window.removeEventListener('cabangSwitch', handleCabangSwitch);
    };
  }, []);
  
  // Determine which layout to use based on user role
  const getLayoutComponent = () => {
    // ... logika untuk menentukan layout berdasarkan role dan cabang ...
  };

  return getLayoutComponent();
};
```

## Cara Kerja

1. **Inisialisasi**:
   - Saat aplikasi dimuat, `CabangContext` akan memeriksa `localStorage` untuk cabang yang tersimpan
   - Jika ada, gunakan cabang tersebut; jika tidak, gunakan default (Global View untuk super_admin)

2. **Perpindahan Cabang**:
   - User memilih cabang dari dropdown di `CabangSwitcher`
   - `switchCabang` dipanggil dengan ID cabang yang dipilih
   - State diperbarui dan disimpan ke `localStorage`
   - `CustomEvent` dipanggil untuk memberi tahu komponen lain

3. **Perubahan Layout**:
   - `DynamicLayout` mendengarkan event `cabangSwitch`
   - Saat event terjadi, `forceUpdate` diperbarui untuk memaksa render ulang
   - Layout yang sesuai dirender berdasarkan `selectedCabang` dan `isGlobalView`

## Keuntungan

1. **Pengalaman pengguna lebih baik**:
   - Perpindahan cabang terjadi secara instan tanpa refresh halaman
   - Tidak ada perubahan URL yang membingungkan

2. **Kode lebih sederhana**:
   - Tidak perlu logika kompleks untuk menangani berbagai struktur route
   - Tidak perlu redirect atau refresh halaman

3. **Persistensi**:
   - Pilihan cabang tetap bertahan setelah refresh halaman
   - User tidak perlu memilih cabang lagi setiap kali refresh

4. **Fleksibilitas**:
   - Struktur route dapat diubah tanpa memengaruhi fitur perpindahan cabang
   - Lebih mudah untuk menambahkan fitur baru terkait cabang

## Troubleshooting

1. **Cabang tidak berubah setelah dipilih**:
   - Periksa apakah event `cabangSwitch` dipanggil dengan benar
   - Periksa apakah `DynamicLayout` mendengarkan event dengan benar

2. **Layout tidak berubah setelah cabang berubah**:
   - Periksa apakah `selectedCabang` dan `isGlobalView` diperbarui dengan benar
   - Periksa apakah `getLayoutComponent` menggunakan nilai yang benar

3. **Cabang tidak tersimpan setelah refresh**:
   - Periksa apakah `localStorage` tersedia dan berfungsi
   - Periksa apakah nilai disimpan dengan benar ke `localStorage`