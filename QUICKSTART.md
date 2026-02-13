# Quick Start Guide

Get the API-First Video App running in 5 minutes!

## Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB installed and running
- Android Studio or Xcode (for mobile emulator)

## Step 1: Start MongoDB

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

## Step 2: Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Generate encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Create .env file
cat > .env << EOF
SECRET_KEY=your-secret-key-$(date +%s)
JWT_SECRET_KEY=your-jwt-key-$(date +%s)
MONGO_URI=mongodb://localhost:27017/videoapp
ENCRYPTION_KEY=your-generated-key-from-above
FLASK_ENV=development
PORT=5000
EOF

# Seed sample videos
python << 'PYEOF'
import requests
response = requests.post('http://localhost:5000/api/admin/seed-videos')
print(response.json())
PYEOF

# Run server
python app.py
```

Backend is now running at `http://localhost:5000`

## Step 3: Setup Mobile App

Open a new terminal:

```bash
cd mobile-app

# Install dependencies
npm install

# iOS only
npx pod-install ios

# Start Metro bundler
npm start
```

Open another terminal:

```bash
cd mobile-app

# Run on Android
npm run android

# Or run on iOS
npm run ios
```

## Step 4: Test the App

1. **Sign Up**: Create a new account
2. **Login**: Use your credentials
3. **Dashboard**: See 2 video tiles
4. **Play Video**: Tap a tile to watch
5. **Settings**: View profile and logout

## API Testing with curl

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get dashboard (replace TOKEN with actual token)
curl http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
lsof -ti:5000 | xargs kill -9  # macOS/Linux
```

**MongoDB connection error:**
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `.env`

### Mobile App Issues

**Metro bundler not starting:**
```bash
npm start -- --reset-cache
```

**Android build fails:**
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

**iOS build fails:**
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

**Network request failed:**
- Ensure backend is running
- Check `API_BASE_URL` in `src/api/client.ts`
- For physical device, use your computer's IP address

## Next Steps

1. **Deploy Backend**: Use Heroku, AWS, or DigitalOcean
2. **Update API URL**: Change `API_BASE_URL` in mobile app
3. **Build Release**: Create production APK/IPA
4. **Add More Videos**: Use the admin seed endpoint

## Project Structure

```
api-first-video-app/
├── backend/          # Flask API
│   ├── app.py       # Main application
│   └── requirements.txt
│
└── mobile-app/      # React Native app
    ├── src/
    │   ├── api/     # API calls
    │   ├── screens/ # UI screens
    │   └── ...
    └── package.json
```

## Support

- Backend logs: `tail -f backend/app.log`
- Mobile logs: Use Flipper or React Native Debugger
- API docs: See `backend/README.md`