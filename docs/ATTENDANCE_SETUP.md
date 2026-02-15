# Employee Attendance System - Setup Guide

Complete employee attendance system with face recognition and liveness detection.

## Features

- **Face Recognition**: High-accuracy face identification using InsightFace
- **Liveness Detection**: Anti-spoofing with texture analysis and blink detection
- **Geofencing**: GPS-based location verification for clock in/out
- **Real-time Tracking**: Clock in/out with photo capture and face verification
- **Admin Dashboard**: Attendance statistics, history, and location management
- **Multi-location Support**: Multiple attendance locations with user assignments

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React App     │──────│  Node.js API     │──────│  Python FastAPI │
│   (Frontend)    │      │  (Backend)       │      │  (Face Service) │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   (Database)    │
                        └─────────────────┘
```

## Prerequisites

### Required Software
- **Node.js** 16+ (for backend)
- **Python** 3.11+ (for face recognition service)
- **PostgreSQL** (database)
- **Docker** (optional, for Python service)

### Hardware Requirements
- **CPU**: Any modern CPU (GPU recommended for better performance)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 5GB free space for models

## Installation Steps

### Step 1: Set Up Python Face Recognition Service

1. **Navigate to the face recognition service directory**:
   ```bash
   cd face-recognition-service
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run the service**:
   ```bash
   # Option 1: Run directly
   python -m app.main

   # Option 2: Run with Docker (recommended)
   docker-compose up -d
   ```

5. **Verify the service is running**:
   ```bash
   curl http://localhost:8001/api/face/health
   ```

### Step 2: Configure Node.js Backend

1. **Add environment variables to `server/.env`**:
   ```env
   # Face Recognition Service
   FACE_SERVICE_URL=http://localhost:8001
   FACE_SERVICE_API_KEY=face-service-api-key

   # Attendance Settings
   DEFAULT_LATE_THRESHOLD=15
   ```

2. **The backend code is already set up** - just ensure the Node.js server is running:
   ```bash
   cd server
   npm start
   ```

### Step 3: Frontend Setup

1. **The frontend code is already integrated** - no additional setup needed

2. **Access the attendance pages**:
   - Employee Attendance: `http://localhost:3000/attendance`
   - Admin Dashboard: `http://localhost:3000/attendance/admin`
   - Location Management: `http://localhost:3000/attendance/locations`

## Initial Configuration

### 1. Create Attendance Locations

As an admin, create attendance locations:

1. Navigate to **Attendance > Locations**
2. Click **Add Location**
3. Fill in:
   - Location name and address
   - GPS coordinates (use Google Maps to get exact coordinates)
   - Geofence radius (in meters)
   - Work hours (start/end time)
   - Settings:
     - ✓ Require user assignment (if only specific users can clock in here)
     - ✓ Require liveness check (for anti-spoofing)
4. Click **Create**

### 2. Assign Users to Locations

1. In the location management page
2. Click on a location
3. Click **View Users** or **Assign Users**
4. Select users to assign

### 3. Register Employee Faces

**Option A: Admin registers for employees**

1. Navigate to **User Management**
2. Select a user
3. Click **Register Face** button
4. Position user's face in camera frame
5. Click **Capture** and **Confirm**
6. Face data is stored and linked to user

**Option B: Employee self-registration**

1. Employee logs in to their account
2. Navigate to **Profile** page
3. Click **Register My Face** button
4. Follow camera instructions
5. Face data is automatically linked to their account

**Face Registration Tips:**
- ✓ Good, even lighting on face
- ✓ Look directly at camera
- ✓ Remove glasses if possible
- ✓ Neutral expression
- ✓ Plain background recommended
- ✗ Avoid hats, caps, or head coverings

## Usage

### Employee: Clock In

1. Navigate to `/attendance`
2. Click **Clock In**
3. Grant camera and location permissions
4. Position face within the frame
5. Click **Capture**
6. System verifies:
   - ✓ Location is within geofence
   - ✓ Face matches registered face
   - ✓ Liveness check passes
7. Clock in successful!

### Employee: Clock Out

1. On the same page, click **Clock Out**
2. Follow same process as clock in
3. System records work hours and calculates overtime

### Admin: View Attendance

1. Navigate to `/attendance/admin`
2. **Overview Tab**:
   - View attendance statistics
   - Filter by date range
   - See attendance rate
3. **History Tab**:
   - View detailed attendance records
   - Filter by employee, date, status
   - Export reports

## API Endpoints

### Python FastAPI Service (Port 8001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/face/register` | POST | Extract face embedding |
| `/api/face/verify` | POST | Verify face against stored embedding |
| `/api/face/liveness/check` | POST | Single-frame liveness detection |
| `/api/face/liveness/check-video` | POST | Multi-frame liveness with blink detection |
| `/api/face/health` | GET | Service health check |

### Node.js Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/attendance/register-face` | POST | Register face for current user |
| `/api/attendance/register-face/:userId` | POST | Register face for specific user (admin) |
| `/api/attendance/clock-in` | POST | Clock in with face verification |
| `/api/attendance/clock-out` | POST | Clock out with face verification |
| `/api/attendance/liveness` | POST | Liveness check only |
| `/api/attendance/today` | GET | Get today's attendance |
| `/api/attendance/history` | GET | Get attendance history |
| `/api/attendance/statistics` | GET | Get attendance statistics |
| `/api/attendance/verify-location` | POST | Verify if location is accessible |
| `/api/attendance-locations` | GET | List attendance locations |
| `/api/attendance-locations` | POST | Create location |
| `/api/attendance-locations/my-locations` | GET | Get current user's locations |
| `/api/attendance-locations/:id` | GET | Get location details |
| `/api/attendance-locations/:id` | PUT | Update location |
| `/api/attendance-locations/:id` | DELETE | Delete location |
| `/api/attendance-locations/:id/users` | GET | Get users assigned to location |
| `/api/attendance-locations/assign` | POST | Assign user to location |
| `/api/attendance-locations/unassign` | POST | Unassign user from location |

## Troubleshooting

### Face Recognition Service Issues

**Service won't start**:
```bash
# Check if port 8001 is available
netstat -an | grep 8001

# Try different port in .env
PORT=8002
```

**Model download fails**:
```bash
# Manually trigger model download
python -c "from insightface.app import FaceAnalysis; app = FaceAnalysis(name='buffalo_l'); app.prepare(ctx_id=-1)"
```

**Out of memory**:
- Reduce `det_size` in `face_recognition.py` from `(640, 640)` to `(512, 512)`

### Backend Issues

**Face service connection refused**:
- Verify Python service is running
- Check `FACE_SERVICE_URL` in `.env`
- Check firewall settings

**Geofencing not working**:
- Verify GPS coordinates are correct
- Increase radius in location settings
- Test with `https://www.gps-coordinates.net/`

### Frontend Issues

**Camera not working**:
- Check browser permissions
- Use HTTPS or localhost
- Try different browser (Chrome recommended)

**Location not working**:
- Check browser location permissions
- Ensure GPS is enabled on device
- Use HTTPS or localhost

## Production Deployment

### Python Service (Docker)

```bash
# Build and deploy
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose logs -f face-recognition
```

### Environment Variables for Production

```env
# Python Service
FACE_SERVICE_API_KEY=your-secure-random-api-key-here
CORS_ORIGINS=["https://your-domain.com"]

# Node.js Backend
FACE_SERVICE_URL=http://face-recognition:8001
FACE_SERVICE_API_KEY=your-secure-random-api-key-here
```

### Security Recommendations

1. **Use strong API keys** - Generate random 32+ character keys
2. **Enable HTTPS** - Required for camera/geolocation in production
3. **Implement rate limiting** - Already configured in backend
4. **Regular security audits** - Review permissions and access logs
5. **Backup face embeddings** - Store securely encrypted

## Performance Optimization

### Enable GPU (CUDA)

1. Install CUDA toolkit
2. Install GPU-enabled dependencies:
   ```bash
   pip install onnxruntime-gpu
   ```
3. Update `face_recognition.py`:
   ```python
   providers=['CUDAExecutionProvider']
   ```

### Redis Caching

Already integrated in backend for:
- Permission caching
- Session management
- Future: Face embedding caching

## Support

For issues or questions:
1. Check logs in `face-recognition-service/` and `server/logs/`
2. Review the troubleshooting section above
3. Check database connection and Prisma migrations

## License

MIT
