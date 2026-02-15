# Face Registration Guide

Panduan implementasi face registration untuk sistem absensi.

## API Endpoint

### Register Face
```
POST /api/attendance/register-face/:userId
Content-Type: application/json

{
  "photo": "base64_encoded_image"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Face registered successfully",
  "data": {
    "success": true,
    "embedding": [0.123, 0.456, ...],
    "faceImageUrl": "https://cloudinary.com/..."
  }
}
```

---

## Frontend Integration

### 1. Di User Management Page (Admin)

Admin bisa registrasi face untuk user lain:

```jsx
// client/src/features/users/pages/UserDetailPage.jsx
import { FaceRegistration } from '../../attendance';

export default function UserDetailPage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  // Fetch user data
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  const handleFaceRegistered = (result) => {
    // Update user state to show face is registered
    setUser(prev => ({
      ...prev,
      faceDataJson: result.embedding,
      faceImageUrl: result.faceImageUrl
    }));
  };

  return (
    <div>
      {/* User info */}
      <h1>{user?.nama}</h1>

      {/* Face Registration Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Face Recognition Data</h3>

        {user?.faceDataJson ? (
          <div className="flex items-center gap-4">
            <img
              src={user.faceImageUrl}
              alt="Registered face"
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div>
              <p className="text-green-600 font-medium">✓ Face Registered</p>
              <p className="text-sm text-gray-600">
                Registered on: {new Date().toLocaleDateString()}
              </p>
              <FaceRegistration
                userId={user.id}
                userName={user.nama}
                hasExistingFace={!!user.faceDataJson}
                onSuccess={handleFaceRegistered}
                buttonText="Update Face"
                buttonClassName="mt-2"
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-3">No face data registered yet.</p>
            <FaceRegistration
              userId={user.id}
              userName={user.nama}
              hasExistingFace={false}
              onSuccess={handleFaceRegistered}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Di Profile Page (User Sendiri)

User bisa registrasi face mereka sendiri:

```jsx
// client/src/features/settings/pages/ProfilePage.jsx
import { FaceRegistration } from '../../attendance';

export default function ProfilePage() {
  const { user } = useAuth(); // dari AuthContext
  const [profile, setProfile] = useState(null);

  const handleFaceRegistered = (result) => {
    setProfile(prev => ({
      ...prev,
      faceDataJson: result.embedding,
      faceImageUrl: result.faceImageUrl
    }));
    toast.success('Face registered successfully!');
  };

  return (
    <div>
      <h1>My Profile</h1>

      {/* Face Recognition Section */}
      <div className="mt-6 border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Face Recognition</h2>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-900">
            Register your face to enable clock in/out with face verification.
            This ensures secure attendance tracking.
          </p>
        </div>

        {profile?.faceDataJson ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profile.faceImageUrl || '/default-avatar.png'}
                alt="Your face"
                className="w-32 h-32 object-cover rounded-lg border-4 border-green-500"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-green-600 font-medium mb-1">Face Verified</p>
              <p className="text-sm text-gray-600 mb-3">
                You can use face recognition for attendance
              </p>
              <FaceRegistration
                userId={user.id}
                userName={user.nama}
                hasExistingFace={true}
                onSuccess={handleFaceRegistered}
                buttonText="Update Face Data"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 mb-4">No face registered yet</p>
            <FaceRegistration
              userId={user.id}
              userName={user.nama}
              hasExistingFace={false}
              onSuccess={handleFaceRegistered}
              buttonText="Register My Face"
              buttonClassName="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3. Sebagai Component Standalone

Untuk integrasi cepat di halaman lain:

```jsx
import { FaceRegistration } from '@features/attendance';

function MyComponent() {
  return (
    <FaceRegistration
      userId="user-uuid-here"
      userName="John Doe"
      hasExistingFace={false}
      onSuccess={(result) => {
        console.log('Face registered!', result);
      }}
      onCancel={() => {
        console.log('User cancelled');
      }}
    />
  );
}
```

---

## Props FaceRegistration Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userId` | string | **required** | User ID untuk register face |
| `userName` | string | "User" | Nama user untuk display |
| `hasExistingFace` | boolean | false | Apakah user sudah punya face data |
| `onSuccess` | function | - | Callback setelah berhasil |
| `onCancel` | function | - | Callback saat user cancel |
| `showButton` | boolean | true | Tampilkan tombol trigger |
| `buttonText` | string | auto | Custom text tombol |
| `buttonClassName` | string | "" | Custom class untuk tombol |

---

## Flow Registrasi Face

### Untuk User (Self-Registration)

1. User login ke aplikasi
2. Buka halaman **Profile**
3. Klik tombol **"Register My Face"**
4. Izinkan akses kamera
5. Posisikan wajah di frame
6. Ikuti instruksi:
   - Pencahayaan baik
   - Lihat langsung ke kamera
   - Lepaskan kacamata jika bisa
   - Ekspresi netral
7. Klik **Capture**
8. Review foto
9. Klik **Confirm**
10. Sistem memproses dan simpan face embedding

### Untuk Admin (Register User Lain)

1. Admin buka **User Management**
2. Pilih user
3. Klik tombol **"Register Face"**
4. Minta user berdiri di depan kamera
5. Follow instruksi yang sama
6. Face data terhubung ke user tersebut

---

## Error Handling

Component ini menangani error secara otomatis:

| Error | Pesan ke User | Solusi |
|-------|---------------|---------|
| No face detected | "No face detected in photo" | Posisikan wajah lebih jelas |
| Multiple faces | "Multiple faces detected" | Pastikan hanya 1 wajah di frame |
| Too bright/dark | "Lighting too bright/dark" | Sesuaikan pencahayaan |
| Camera denied | "Camera permission denied" | Izinkan akses kamera |
| Registration failed | "Registration failed" | Coba lagi |

---

## Testing

### Test Registration Manual

```bash
# 1. Dapatkan photo user
# 2. Convert ke base64
photo_base64=$(base64 -w 0 photo.jpg)

# 3. Register via API
curl -X POST http://localhost:3000/api/attendance/register-face/USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d "{\"photo\": \"$photo_base64\"}"
```

### Test Clock In setelah Registrasi

```bash
# Setelah face terdaftar, user bisa clock in
curl -X POST http://localhost:3000/api/attendance/clock-in \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "lokasiAbsensiId": "LOCATION_UUID",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "photo": "BASE64_PHOTO"
  }'
```

---

## Troubleshooting

### Camera tidak muncul
- Pastikan menggunakan HTTPS atau localhost
- Check browser permissions
- Coba browser lain (Chrome recommended)

### Face registration gagal terus
- Pastikan pencahayaan cukup
- Posisikan wajah lebih dekat ke kamera
- Lepaskan kacamata/topi
- Background sebaiknya polos

### "Face recognition service not available"
- Pastikan Python service running di port 8001
- Check `server/.env` untuk `FACE_SERVICE_URL`

---

## Security Notes

1. **Encrypt face embeddings** di database untuk production
2. **Use HTTPS** wajib untuk camera access
3. **Rate limiting** sudah diimplement di backend
4. **API key validation** untuk Python service
5. **Audit logging** untuk semua face operations

---

## Next Steps

Setelah face registration selesai:

1. ✅ User bisa clock in/out dengan face verification
2. ✅ Admin bisa monitoring di `/attendance/admin`
3. ✅ Laporan kehadiran tersimpan lengkap dengan face match score
4. ✅ Geofencing memastikan user di lokasi yang benar
