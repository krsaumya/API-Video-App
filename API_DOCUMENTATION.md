# API Documentation

Complete reference for the Video App API.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST /auth/signup

Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Errors:**
- `400` - Missing required fields
- `409` - Email already registered

---

#### POST /auth/login

Authenticate user and get tokens.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid credentials
- `403` - Account deactivated

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

**Errors:**
- `401` - Invalid refresh token

---

#### GET /auth/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

#### POST /auth/logout

Logout user and revoke token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### Videos

#### GET /dashboard

Get videos for dashboard (paginated).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| per_page | int | 2 | Items per page |

**Response (200):**
```json
{
  "videos": [
    {
      "id": "video-uuid",
      "title": "How Startups Fail",
      "description": "Lessons from real founders",
      "thumbnail_url": "https://img.youtube.com/vi/...",
      "playback_token": "abc123..."
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 2,
    "total": 10,
    "total_pages": 5
  }
}
```

---

#### GET /video/{id}/stream

Get secure stream URL for video.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | Playback token from dashboard |

**Response (200):**
```json
{
  "video_id": "video-uuid",
  "title": "How Startups Fail",
  "description": "Lessons from real founders",
  "thumbnail_url": "https://img.youtube.com/vi/...",
  "stream": {
    "type": "youtube_embed",
    "embed_url": "https://www.youtube.com/embed/...",
    "poster_url": "https://img.youtube.com/vi/..."
  }
}
```

**Errors:**
- `403` - Invalid or expired playback token
- `404` - Video not found

---

#### POST /video/{id}/watch

Track video watch progress.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "progress_seconds": 120,
  "duration_seconds": 600,
  "completed": false
}
```

**Response (200):**
```json
{
  "message": "Watch event recorded"
}
```

### Admin

#### POST /admin/seed-videos

Seed sample videos (development only).

**Response (201):**
```json
{
  "message": "Seeded 4 videos successfully"
}
```

### Health

#### GET /health

Health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 10/minute |
| POST /auth/signup | 5/minute |
| All other endpoints | 200/day, 50/hour |

Rate limit headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1640995200
```

## Token Lifecycle

1. **Access Token**: Valid for 15 minutes
2. **Refresh Token**: Valid for 7 days
3. **Playback Token**: Valid for 2 hours

### Token Refresh Flow

```
1. Client makes request with access_token
2. Server returns 401 (token expired)
3. Client sends refresh request with refresh_token
4. Server returns new access_token
5. Client retries original request
```

## Security Features

### Playback Token

Playback tokens are SHA256 hashes:
```
SHA256(video_id + ":" + user_id + ":" + timestamp + ":" + SECRET_KEY)
```

This ensures:
- Tokens are unique per user and video
- Tokens expire after 2 hours
- Tokens cannot be forged without SECRET_KEY

### YouTube ID Protection

- YouTube IDs are never exposed to client
- Backend converts IDs to embed URLs
- Playback tokens required for access
- Direct YouTube access is blocked

## Postman Collection

```json
{
  "info": {
    "name": "Video App API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Signup",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": "{{base_url}}/auth/signup",
            "body": {
              "mode": "raw",
              "raw": "{\"name\":\"Test\",\"email\":\"test@test.com\",\"password\":\"password123\"}"
            }
          }
        }
      ]
    }
  ]
}
```