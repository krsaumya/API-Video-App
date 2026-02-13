# Video App Backend

Flask REST API for the Video App with MongoDB integration.

## Features

- JWT Authentication with access & refresh tokens
- Rate limiting on sensitive endpoints
- Secure YouTube video wrapper
- Request/Response logging
- Token blacklist for logout
- Pagination support
- Video watch tracking

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your values
```

## Running

```bash
# Development
python app.py

# Production
export FLASK_ENV=production
gunicorn app:app
```

## API Endpoints

### Auth

**POST /api/auth/signup**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**POST /api/auth/login**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**GET /api/auth/me**
Headers: `Authorization: Bearer <token>`

**POST /api/auth/refresh**
Headers: `Authorization: Bearer <refresh_token>`

**POST /api/auth/logout**
Headers: `Authorization: Bearer <token>`

### Videos

**GET /api/dashboard**
Headers: `Authorization: Bearer <token>`
Query: `?page=1&per_page=2`

**GET /api/video/:id/stream?token=...**
Headers: `Authorization: Bearer <token>`

**POST /api/video/:id/watch**
Headers: `Authorization: Bearer <token>`
```json
{
  "progress_seconds": 120,
  "duration_seconds": 600,
  "completed": false
}
```

## Database Schema

### Users Collection
```javascript
{
  _id: String,
  name: String,
  email: String (unique),
  password_hash: String,
  created_at: DateTime,
  updated_at: DateTime,
  is_active: Boolean,
  last_login: DateTime,
  total_watch_time: Number
}
```

### Videos Collection
```javascript
{
  _id: String,
  title: String,
  description: String,
  youtube_id: String,
  thumbnail_url: String,
  is_active: Boolean,
  created_at: DateTime
}
```

### Tokens Collection (Blacklist)
```javascript
{
  jti: String (unique),
  user_id: String,
  revoked_at: DateTime,
  expireAt: DateTime (TTL index)
}
```

### Watch History Collection
```javascript
{
  user_id: String,
  video_id: String,
  watched_at: DateTime,
  progress_seconds: Number,
  duration_seconds: Number,
  completed: Boolean,
  device_info: String
}
```

## Security Implementation

### Playback Token Verification

Tokens are SHA256 hashes with the following format:
```
SHA256(video_id + ":" + user_id + ":" + timestamp + ":" + SECRET_KEY)
```

Tokens are valid for 2 hours to account for clock skew.

### Rate Limiting

- Login: 10 requests per minute
- Signup: 5 requests per minute
- Default: 200 per day, 50 per hour

## Logging

Logs are written to:
- Console (stdout)
- `app.log` file

Format:
```
2024-01-15 10:30:45,123 - app - INFO - Request: POST /api/auth/login - IP: 127.0.0.1
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SECRET_KEY | Flask secret key | Random |
| JWT_SECRET_KEY | JWT signing key | Random |
| MONGO_URI | MongoDB connection | localhost |
| REDIS_URL | Redis for rate limiting | memory |
| ENCRYPTION_KEY | Fernet encryption key | Random |
| FLASK_ENV | Environment | development |
| PORT | Server port | 5000 |