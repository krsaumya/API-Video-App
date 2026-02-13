# Deployment Guide

Deploy the Video App to production environments.

## Backend Deployment

### Option 1: Heroku (Recommended for Quick Deploy)

```bash
cd backend

# Create Heroku app
heroku create your-video-app-api

# Add MongoDB
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set SECRET_KEY=$(openssl rand -hex 32)
heroku config:set JWT_SECRET_KEY=$(openssl rand -hex 32)
heroku config:set ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
heroku config:set FLASK_ENV=production

# Create Procfile
echo "web: gunicorn app:app --workers 4 --bind 0.0.0.0:\$PORT" > Procfile

# Deploy
git init
git add .
git commit -m "Initial deployment"
heroku git:remote -a your-video-app-api
git push heroku main

# Seed videos
heroku run python -c "import requests; requests.post('http://localhost:5000/api/admin/seed-videos')"
```

### Option 2: AWS Elastic Beanstalk

```bash
cd backend

# Install EB CLI
pip install awsebcli

# Initialize
eb init -p python-3.9 video-app-api

# Create environment
eb create video-app-api-env

# Set environment variables
eb setenv SECRET_KEY=your-secret JWT_SECRET_KEY=your-jwt-key

# Deploy
eb deploy
```

### Option 3: Docker

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "app:app", "--workers", "4", "--bind", "0.0.0.0:5000"]
```

```bash
# Build and run
docker build -t video-app-api .
docker run -p 5000:5000 \
  -e SECRET_KEY=your-secret \
  -e JWT_SECRET_KEY=your-jwt-key \
  -e MONGO_URI=mongodb://host.docker.internal:27017/videoapp \
  video-app-api
```

### Option 4: DigitalOcean App Platform

```yaml
# .do/app.yaml
name: video-app-api
services:
  - name: api
    source_dir: /
    github:
      repo: yourusername/video-app-api
      branch: main
    build_command: pip install -r requirements.txt
    run_command: gunicorn app:app --workers 4 --bind 0.0.0.0:8080
    environment_slug: python
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: SECRET_KEY
        value: your-secret-key
      - key: JWT_SECRET_KEY
        value: your-jwt-key
      - key: MONGO_URI
        value: your-mongodb-uri
```

## MongoDB Deployment

### MongoDB Atlas (Recommended)

1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create new cluster (free tier available)
3. Add database user
4. Whitelist your IP
5. Get connection string:
```
mongodb+srv://username:password@cluster.mongodb.net/videoapp?retryWrites=true&w=majority
```

### Self-Hosted

```bash
# Using Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

## Mobile App Deployment

### Update API URL

Edit `src/api/client.ts`:

```typescript
// Production
const API_BASE_URL = 'https://your-api-domain.com/api';
```

### Android Release Build

```bash
cd mobile-app

# Generate signing key
keytool -genkey -v -keystore videoapp.keystore -alias videoapp -keyalg RSA -keysize 2048 -validity 10000

# Move keystore
mv videoapp.keystore android/app/

# Create gradle config
cat >> android/gradle.properties << EOF
MYAPP_UPLOAD_STORE_FILE=videoapp.keystore
MYAPP_UPLOAD_KEY_ALIAS=videoapp
MYAPP_UPLOAD_STORE_PASSWORD=your-password
MYAPP_UPLOAD_KEY_PASSWORD=your-password
EOF

# Update android/app/build.gradle signingConfigs

# Build release
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### iOS Release Build

```bash
cd mobile-app/ios

# Open in Xcode
open VideoApp.xcworkspace

# Product > Archive
# Distribute App
```

### CodePush (Over-the-air updates)

```bash
# Install CodePush
npm install react-native-code-push

# Setup with App Center
appcenter apps create -d VideoApp -o iOS -p React-Native
appcenter codepush release-react -a YourOrg/VideoApp
```

## Environment Configuration

### Production Checklist

- [ ] Change all secret keys
- [ ] Enable HTTPS only
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting with Redis
- [ ] Enable request logging
- [ ] Configure MongoDB authentication
- [ ] Set up monitoring (Sentry/DataDog)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

### Security Headers

```python
# Add to Flask app
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response
```

## Monitoring

### Sentry Integration

```python
# Backend
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0,
)
```

```typescript
// Mobile
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
});
```

### Logging with LogDNA/Papertrail

```python
import logging
import logdna

log = logging.getLogger('logdna')
log.setLevel(logging.INFO)

options = {
    'hostname': 'video-app-api',
    'ip': '127.0.0.1',
    'mac': 'C0:FF:EE:C0:FF:EE'
}

test = logdna.LogdnaHandler('your-api-key', options)
logging.getLogger().addHandler(test)
```

## SSL/TLS

### Let's Encrypt with Nginx

```nginx
# /etc/nginx/sites-available/video-app
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Backup Strategy

### MongoDB Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGO_URI" --out=/backups/mongodb_$DATE
tar -czf /backups/mongodb_$DATE.tar.gz /backups/mongodb_$DATE
rm -rf /backups/mongodb_$DATE

# Keep only last 7 days
find /backups -name "mongodb_*.tar.gz" -mtime +7 -delete
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml for multiple instances
version: '3'
services:
  api1:
    build: .
    ports:
      - "5001:5000"
    environment:
      - SECRET_KEY=${SECRET_KEY}
  
  api2:
    build: .
    ports:
      - "5002:5000"
    environment:
      - SECRET_KEY=${SECRET_KEY}
  
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Load Balancer Nginx Config

```nginx
upstream api_backend {
    least_conn;
    server localhost:5001;
    server localhost:5002;
    server localhost:5003;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Cost Estimation

| Service | Monthly Cost |
|---------|--------------|
| Heroku (Hobby) | $7 |
| MongoDB Atlas (M10) | $57 |
| AWS EC2 (t3.small) | $15 |
| DigitalOcean (Basic) | $5 |
| Sentry | $0-26 |
| **Total (Budget)** | **~$30-100** |

## Troubleshooting Production

### Check logs
```bash
# Heroku
heroku logs --tail

# AWS
eb logs

# Docker
docker logs container-id
```

### Database connection issues
```bash
# Test MongoDB connection
mongo "mongodb+srv://user:pass@cluster.mongodb.net/test"
```

### Memory issues
```bash
# Monitor memory
heroku ps:metrics web
```