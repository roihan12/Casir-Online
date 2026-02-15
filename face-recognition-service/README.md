# Face Recognition Service

Employee attendance face recognition and liveness detection service using InsightFace and FastAPI.

## Features

- **Face Detection**: High-accuracy face detection using InsightFace (buffalo_l model)
- **Face Recognition**: 512-dimensional face embeddings for identification
- **Liveness Detection**: Anti-spoofing with texture analysis, quality checks, and lighting analysis
- **Blink Detection**: Video-based liveness detection with eye aspect ratio analysis
- **FastAPI**: Modern, fast Python web framework
- **Docker**: Containerized deployment

## Installation

### Local Development

1. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run the service**:
```bash
python -m app.main
```

The service will be available at `http://localhost:8001`

### Docker Deployment

1. **Build and run with Docker Compose**:
```bash
docker-compose up -d
```

2. **Or build manually**:
```bash
docker build -t face-recognition-service .
docker run -p 8001:8001 --env-file .env face-recognition-service
```

## API Endpoints

### POST /api/face/register
Extract face embedding from an image for registration.

**Request:**
- `image`: Face image file (multipart/form-data)
- `user_id`: User ID (for logging)

**Response:**
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...],
  "bbox": [x, y, w, h],
  "landmarks": [[x, y], ...],
  "det_score": 0.99,
  "age": 30,
  "gender": "Male",
  "message": "Face embedding extracted successfully"
}
```

### POST /api/face/verify
Verify a face against a stored embedding.

**Request:**
- `image`: Face image file (multipart/form-data)
- `stored_embedding`: Stored face embedding (JSON array string)
- `user_id`: User ID (for logging)

**Response:**
```json
{
  "success": true,
  "is_match": true,
  "similarity": 0.85,
  "distance": 0.15,
  "threshold": 0.4,
  "message": "Face verified successfully"
}
```

### POST /api/face/liveness/check
Check liveness of a face image (single frame).

**Request:**
- `image`: Face image file (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "is_live": true,
  "liveness_score": 0.75,
  "texture_score": 0.7,
  "quality_score": 0.8,
  "lighting_score": 0.75,
  "threshold": 0.5,
  "details": {
    "texture_pass": true,
    "quality_pass": true,
    "lighting_pass": true
  },
  "message": "Liveness verified - image appears to be from a live person"
}
```

### POST /api/face/liveness/check-video
Check liveness from multiple video frames with blink detection.

**Request:**
- `images`: Multiple video frame images (3-30 frames)

**Response:**
```json
{
  "success": true,
  "is_live": true,
  "liveness_score": 0.82,
  "blink_detected": true,
  "avg_texture_score": 0.7,
  "quality_score": 0.8,
  "lighting_score": 0.75,
  "threshold": 0.5,
  "frames_analyzed": 10,
  "message": "Liveness verified - blink detected: true"
}
```

### GET /api/face/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "Face Recognition Service",
  "version": "1.0.0",
  "model_loaded": true
}
```

## Configuration

Key environment variables (see `.env.example`):

- `API_KEY`: API key for authentication (set in X-API-Key header)
- `FACE_MODEL`: Face recognition model (buffalo_l or buffalo_m)
- `SIMILARITY_THRESHOLD`: Face matching threshold (lower = more strict)
- `LIVENESS_ENABLED`: Enable/disable liveness detection
- `LIVENESS_THRESHOLD`: Liveness score threshold
- `MAX_IMAGE_SIZE`: Maximum image size in bytes (default: 10MB)

## Testing

### Test with cURL

```bash
# Health check
curl http://localhost:8001/api/face/health

# Register face
curl -X POST http://localhost:8001/api/face/register \
  -H "X-API-Key: face-service-api-key" \
  -F "user_id=test123" \
  -F "image=@/path/to/photo.jpg"

# Verify face
curl -X POST http://localhost:8001/api/face/verify \
  -H "X-API-Key: face-service-api-key" \
  -F "user_id=test123" \
  -F "stored_embedding=[0.123,0.456,...]" \
  -F "image=@/path/to/photo.jpg"

# Liveness check
curl -X POST http://localhost:8001/api/face/liveness/check \
  -H "X-API-Key: face-service-api-key" \
  -F "image=@/path/to/photo.jpg"
```

### Test with Postman

1. Set header `X-API-Key: face-service-api-key`
2. Use form-data for file uploads
3. For `stored_embedding`, paste the JSON array as text

## Model Information

The service uses InsightFace's buffalo_l model:
- **Backbone**: ResNet50 + ArcFace
- **Embedding Size**: 512 dimensions
- **Face Detection**: RetinaFace
- **Landmarks**: 106-point facial landmarks

First run will download the models (~300MB). With Docker, models are cached in a volume.

## Performance

- **CPU**: ~200ms per face detection + embedding
- **GPU**: ~50ms per face detection + embedding (with CUDA)
- **Accuracy**: >99% on standard benchmarks

## Security

- API key authentication required for all endpoints
- CORS configured for allowed origins
- Input validation and file size limits
- Error handling and logging

## Troubleshooting

### Models not downloading
```bash
# Manually trigger model download
python -c "from insightface.app import FaceAnalysis; app = FaceAnalysis(name='buffalo_l'); app.prepare(ctx_id=-1)"
```

### Out of memory
Reduce `det_size` in `face_recognition.py` from `(640, 640)` to `(512, 512)`.

### GPU not detected
Ensure CUDA-compatible GPU and nvidia-docker runtime installed.

## License

MIT
