# Video App Mobile

React Native mobile app for the Video App - a thin client that depends entirely on the Flask backend.

## Architecture

This app follows the **thin client** pattern:
- No business logic in the app
- All data comes from API calls
- JWT tokens stored securely
- Automatic token refresh

## Project Structure

```
src/
├── api/
│   ├── client.ts      # Axios client with interceptors
│   ├── auth.ts        # Auth API calls
│   └── videos.ts      # Video API calls
├── components/        # Reusable UI components
├── contexts/
│   └── AuthContext.tsx # Global auth state
├── navigation/
│   └── AppNavigator.tsx # Navigation setup
├── screens/
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── VideoPlayerScreen.tsx
│   └── SettingsScreen.tsx
├── types/
│   └── index.ts       # TypeScript types
└── App.tsx           # Entry point
```

## Installation

```bash
# Install dependencies
npm install

# iOS - install CocoaPods
cd ios && pod install && cd ..
```

## Running

```bash
# Start Metro
npm start

# Android
npm run android

# iOS
npm run ios
```

## Configuration

Update the API base URL in `src/api/client.ts`:

```typescript
// Android Emulator
const API_BASE_URL = 'http://10.0.2.2:5000/api';

// iOS Simulator
const API_BASE_URL = 'http://localhost:5000/api';

// Physical Device (same network)
const API_BASE_URL = 'http://192.168.1.100:5000/api';
```

## Features

### Authentication
- Login with email/password
- Signup with name, email, password
- JWT token storage (secure)
- Automatic token refresh
- Logout with token revocation

### Video Playback
- Dashboard with video tiles
- Secure video streaming (no direct YouTube URLs)
- Play/Pause controls
- Mute/Unmute
- Watch progress tracking

### UI/UX
- Material Design inspired
- Pull-to-refresh
- Loading states
- Error handling
- Responsive layout

## Dependencies

- `@react-navigation/native` - Navigation
- `@react-native-async-storage/async-storage` - Secure storage
- `axios` - HTTP client
- `react-native-youtube-iframe` - YouTube player
- `react-native-vector-icons` - Icons

## Token Management

The app handles token expiration automatically:

1. Access tokens expire after 15 minutes
2. Refresh tokens expire after 7 days
3. On 401 error, app attempts token refresh
4. If refresh fails, user is logged out

```typescript
// Token storage keys
@access_token
@refresh_token
@token_expiry
```

## TypeScript Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  playback_token: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Building

### Android

```bash
cd android
./gradlew assembleRelease
```

### iOS

```bash
cd ios
xcodebuild -workspace VideoApp.xcworkspace -scheme VideoApp -configuration Release
```

## Troubleshooting

### Metro bundler issues
```bash
npm start -- --reset-cache
```

### iOS build issues
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android network issues
Ensure `android:usesCleartextTraffic="true"` in `AndroidManifest.xml` for development.