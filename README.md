# API-First Video App

A complete video streaming application with a Flask backend and React Native mobile app. The mobile app acts as a thin client with all business logic residing in the backend.

## System Architecture

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐     ┌─────────────────┐
│  React Native   │ ◄────────────────► │  Flask Backend  │ ◄──►│    MongoDB      │
│   Mobile App    │                    │   REST API      │     │   Database      │
│  (Thin Client)  │                    │                 │     │                 │
└─────────────────┘                    └────────┬────────┘     └─────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │     YouTube     │
                                       │  (via wrapper)  │
                                       └─────────────────┘
```

## Project Structure

```
api-first-video-app/
├── backend/                 # Flask Backend
│   ├── app.py              # Main application
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variables template
│   └── .gitignore
│
└── mobile-app/             # React Native App
    ├── src/
    │   ├── api/            # API client and services
    │   ├── components/     # Reusable components
    │   ├── contexts/       # React contexts (Auth)
    │   ├── navigation/     # Navigation setup
    │   ├── screens/        # Screen components
    │   ├── types/          # TypeScript types
    │   └── App.tsx         # Main app component
    ├── package.json
    ├── tsconfig.json
    └── ...config files
```

## Features

### Backend (Flask + MongoDB)

- ✅ **JWT Authentication** with access & refresh tokens
- ✅ **Password Hashing** with bcrypt
- ✅ **Rate Limiting** on auth endpoints
- ✅ **Request Logging** to file and console
- ✅ **Token Blacklist** for secure logout
- ✅ **YouTube Video Wrapper** - no direct YouTube URLs exposed
- ✅ **Secure Playback Tokens** with expiration
- ✅ **Pagination-ready** dashboard endpoint
- ✅ **Video Watch Tracking** endpoint
- ✅ **Auto-cleanup** of expired tokens

### Mobile App (React Native)

- ✅ **Thin Client Architecture** - no business logic
- ✅ **JWT Token Management** with secure storage
- ✅ **Automatic Token Refresh** on 401 errors
- ✅ **Login & Signup Screens**
- ✅ **Dashboard** with video tiles
- ✅ **Video Player** with YouTube iframe
- ✅ **Settings Screen** with user info & logout
- ✅ **Pull-to-refresh** on dashboard
- ✅ **Watch Progress Tracking**

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB (local or Atlas)
- Android Studio / Xcode (for mobile simulators)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if local)
# mongod --dbpath /path/to/data

# Seed sample videos
python -c "from app import app; app.test_client().post('/api/admin/seed-videos')"

# Run the server
python app.py
```

The backend will start on `http://localhost:5000`

### Mobile App Setup

```bash
cd mobile-app

# Install dependencies
npm install

# iOS only - install pods
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android (in another terminal)
npm run android

# Run on iOS (in another terminal)
npm run ios
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/signup` | Register new user | 5/min |
| POST | `/api/auth/login` | Login user | 10/min |
| POST | `/api/auth/refresh` | Refresh access token | - |
| GET | `/api/auth/me` | Get current user | - |
| POST | `/api/auth/logout` | Logout & revoke token | - |

### Video Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get videos (paginated) |
| GET | `/api/video/<id>/stream` | Get secure stream URL |
| POST | `/api/video/<id>/watch` | Track watch progress |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/seed-videos` | Seed sample videos |

## Security Features

1. **No Direct YouTube URLs**: Backend wraps YouTube IDs with secure playback tokens
2. **Token-based Authentication**: Short-lived access tokens (15 min) + refresh tokens (7 days)
3. **Rate Limiting**: Prevents brute force attacks on auth endpoints
4. **Password Hashing**: bcrypt with 12 rounds
5. **Token Blacklist**: Revoked tokens are tracked and auto-expire
6. **CORS Protection**: Configurable CORS for production

## Environment Variables

### Backend (.env)

```env
SECRET_KEY=your-super-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
MONGO_URI=mongodb://localhost:27017/videoapp
REDIS_URL=redis://localhost:6379/0
ENCRYPTION_KEY=your-fernet-encryption-key
FLASK_ENV=development
PORT=5000
```

Generate encryption key:
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

## Deployment

### Backend (Heroku Example)

```bash
# Create Procfile
echo "web: gunicorn app:app" > Procfile

# Deploy
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
heroku addons:create mongolab
heroku config:set SECRET_KEY=your-secret
heroku config:set JWT_SECRET_KEY=your-jwt-secret
git push heroku main
```

### Mobile App

Update `API_BASE_URL` in `src/api/client.ts` to point to your deployed backend.

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Mobile Tests

```bash
cd mobile-app
npm test
```

## License

MIT License