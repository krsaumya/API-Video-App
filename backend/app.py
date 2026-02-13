"""
API-First Video App - Flask Backend
====================================
A secure Flask backend for video streaming with MongoDB.
Features: JWT auth, rate limiting, YouTube video wrapper, logging
"""

from flask import Flask, request, jsonify, Response
from flask_pymongo import PyMongo
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt, set_access_cookies,
    set_refresh_cookies, unset_jwt_cookies
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
import bcrypt
import os
import logging
import uuid
import secrets
import hashlib
from functools import wraps
from dotenv import load_dotenv
import yt_dlp
import requests
from cryptography.fernet import Fernet

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=15)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/videoapp')
app.config['ENCRYPTION_KEY'] = os.getenv('ENCRYPTION_KEY', Fernet.generate_key().decode())

# Initialize extensions
mongo = PyMongo(app)
jwt = JWTManager(app)
cipher_suite = Fernet(app.config['ENCRYPTION_KEY'].encode())

# CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],  # Configure for production
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type"]
    }
})

# Rate limiter configuration
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv('REDIS_URL', 'memory://')
)

# ============== DATABASE MODELS ==============

def get_user_collection():
    return mongo.db.users

def get_video_collection():
    return mongo.db.videos

def get_token_collection():
    return mongo.db.tokens

def get_watch_history_collection():
    return mongo.db.watch_history

# ============== JWT TOKEN BLACKLIST ==============

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload['jti']
    token = get_token_collection().find_one({'jti': jti})
    return token is not None

# ============== AUTHENTICATION UTILS ==============

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_tokens(user_id: str) -> dict:
    """Generate access and refresh tokens"""
    access_token = create_access_token(identity=user_id)
    refresh_token = create_refresh_token(identity=user_id)
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': 900  # 15 minutes
    }

def encrypt_youtube_id(youtube_id: str) -> str:
    """Encrypt YouTube ID for secure transmission"""
    return cipher_suite.encrypt(youtube_id.encode()).decode()

def decrypt_youtube_id(encrypted_id: str) -> str:
    """Decrypt YouTube ID"""
    return cipher_suite.decrypt(encrypted_id.encode()).decode()

def generate_playback_token(video_id: str, user_id: str) -> str:
    """Generate signed playback token"""
    timestamp = datetime.now(timezone.utc).isoformat()
    data = f"{video_id}:{user_id}:{timestamp}:{app.config['SECRET_KEY']}"
    return hashlib.sha256(data.encode()).hexdigest()

def verify_playback_token(video_id: str, user_id: str, token: str) -> bool:
    """Verify playback token validity"""
    # Token valid for 2 hours
    for hour_offset in range(3):
        timestamp = (datetime.now(timezone.utc) - timedelta(hours=hour_offset)).isoformat()
        data = f"{video_id}:{user_id}:{timestamp}:{app.config['SECRET_KEY']}"
        expected = hashlib.sha256(data.encode()).hexdigest()
        if secrets.compare_digest(token, expected):
            return True
    return False

# ============== REQUEST LOGGING MIDDLEWARE ==============

@app.before_request
def log_request():
    """Log all incoming requests"""
    logger.info(f"Request: {request.method} {request.path} - IP: {get_remote_address()}")

@app.after_request
def log_response(response):
    """Log response status"""
    logger.info(f"Response: {response.status_code} for {request.method} {request.path}")
    return response

# ============== AUTHENTICATION ENDPOINTS ==============

@app.route('/api/auth/signup', methods=['POST'])
@limiter.limit("5 per minute")
def signup():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validation
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not name or not email or not password:
            return jsonify({'error': 'Name, email, and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user exists
        if get_user_collection().find_one({'email': email}):
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create user
        user = {
            '_id': str(uuid.uuid4()),
            'name': name,
            'email': email,
            'password_hash': hash_password(password),
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'is_active': True
        }
        
        get_user_collection().insert_one(user)
        
        # Generate tokens
        tokens = generate_tokens(user['_id'])
        
        logger.info(f"User registered: {email}")
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user['_id'],
                'name': user['name'],
                'email': user['email']
            },
            'tokens': tokens
        }), 201
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """Authenticate user and return tokens"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = get_user_collection().find_one({'email': email})
        
        if not user or not verify_password(password, user['password_hash']):
            logger.warning(f"Failed login attempt for: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Generate tokens
        tokens = generate_tokens(user['_id'])
        
        # Update last login
        get_user_collection().update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.now(timezone.utc)}}
        )
        
        logger.info(f"User logged in: {email}")
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['_id'],
                'name': user['name'],
                'email': user['email']
            },
            'tokens': tokens
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    try:
        user_id = get_jwt_identity()
        
        # Verify user still exists
        user = get_user_collection().find_one({'_id': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new access token
        access_token = create_access_token(identity=user_id)
        
        logger.info(f"Token refreshed for user: {user_id}")
        
        return jsonify({
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': 900
        }), 200
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = get_user_collection().find_one({'_id': user_id})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user['_id'],
            'name': user['name'],
            'email': user['email'],
            'created_at': user['created_at'].isoformat() if user.get('created_at') else None
        }), 200
        
    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and revoke token"""
    try:
        jti = get_jwt()['jti']
        user_id = get_jwt_identity()
        
        # Add token to blacklist
        get_token_collection().insert_one({
            'jti': jti,
            'user_id': user_id,
            'revoked_at': datetime.now(timezone.utc)
        })
        
        logger.info(f"User logged out: {user_id}")
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============== VIDEO ENDPOINTS ==============

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get 2 active videos for dashboard"""
    try:
        user_id = get_jwt_identity()
        
        # Get page parameter for pagination (bonus feature)
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 2))
        
        # Fetch active videos with pagination
        videos = list(get_video_collection().find(
            {'is_active': True}
        ).skip((page - 1) * per_page).limit(per_page))
        
        # Get total count for pagination info
        total = get_video_collection().count_documents({'is_active': True})
        
        result = []
        for video in videos:
            # Generate secure playback token
            playback_token = generate_playback_token(str(video['_id']), user_id)
            
            result.append({
                'id': str(video['_id']),
                'title': video['title'],
                'description': video['description'],
                'thumbnail_url': video['thumbnail_url'],
                'playback_token': playback_token,
                'created_at': video.get('created_at', datetime.now(timezone.utc)).isoformat()
            })
        
        return jsonify({
            'videos': result,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': (total + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/video/<video_id>/stream', methods=['GET'])
@jwt_required()
def get_video_stream(video_id):
    """Get secure stream URL for video"""
    try:
        user_id = get_jwt_identity()
        token = request.args.get('token')
        
        # Verify playback token
        if not token or not verify_playback_token(video_id, user_id, token):
            return jsonify({'error': 'Invalid or expired token'}), 403
        
        # Get video from database
        video = get_video_collection().find_one({'_id': video_id})
        if not video:
            return jsonify({'error': 'Video not found'}), 404
        
        if not video.get('is_active', True):
            return jsonify({'error': 'Video is not available'}), 403
        
        youtube_id = video['youtube_id']
        
        # Option A: Return embed-safe URL (simpler)
        # embed_url = f"https://www.youtube.com/embed/{youtube_id}"
        
        # Option B: Return stream info with proxy capability (better)
        stream_data = {
            'video_id': video_id,
            'title': video['title'],
            'description': video['description'],
            'thumbnail_url': video['thumbnail_url'],
            'stream': {
                'type': 'youtube_embed',
                'embed_url': f"https://www.youtube.com/embed/{youtube_id}",
                'poster_url': video['thumbnail_url']
            }
        }
        
        # Log watch event (async-like, don't wait)
        try:
            get_watch_history_collection().insert_one({
                'user_id': user_id,
                'video_id': video_id,
                'watched_at': datetime.now(timezone.utc),
                'action': 'stream_requested'
            })
        except Exception as log_err:
            logger.warning(f"Failed to log watch event: {log_err}")
        
        return jsonify(stream_data), 200
        
    except Exception as e:
        logger.error(f"Stream error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/video/<video_id>/watch', methods=['POST'])
@jwt_required()
def track_video_watch(video_id):
    """Track video watch progress (bonus feature)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Validate video exists
        video = get_video_collection().find_one({'_id': video_id})
        if not video:
            return jsonify({'error': 'Video not found'}), 404
        
        # Record watch event
        watch_record = {
            'user_id': user_id,
            'video_id': video_id,
            'watched_at': datetime.now(timezone.utc),
            'progress_seconds': data.get('progress_seconds', 0),
            'duration_seconds': data.get('duration_seconds'),
            'completed': data.get('completed', False),
            'device_info': request.headers.get('User-Agent')
        }
        
        get_watch_history_collection().insert_one(watch_record)
        
        # Update user's watch stats
        get_user_collection().update_one(
            {'_id': user_id},
            {
                '$inc': {'total_watch_time': data.get('progress_seconds', 0)},
                '$set': {'last_watch_at': datetime.now(timezone.utc)}
            }
        )
        
        return jsonify({'message': 'Watch event recorded'}), 200
        
    except Exception as e:
        logger.error(f"Watch tracking error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============== ADMIN ENDPOINTS (for seeding data) ==============

@app.route('/api/admin/seed-videos', methods=['POST'])
def seed_videos():
    """Seed sample videos (for development)"""
    try:
        # Check if videos already exist
        if get_video_collection().count_documents({}) > 0:
            return jsonify({'message': 'Videos already seeded'}), 200
        
        sample_videos = [
            {
                '_id': str(uuid.uuid4()),
                'title': 'How Startups Fail',
                'description': 'Lessons from real founders about common pitfalls and how to avoid them in your startup journey.',
                'youtube_id': 'J8M5dPRcNus',
                'thumbnail_url': 'https://img.youtube.com/vi/J8M5dPRcNus/maxresdefault.jpg',
                'is_active': True,
                'created_at': datetime.now(timezone.utc)
            },
            {
                '_id': str(uuid.uuid4()),
                'title': 'The Art of Product Management',
                'description': 'Learn the essential skills and frameworks used by top product managers at leading tech companies.',
                'youtube_id': 'huTSPanXdqg',
                'thumbnail_url': 'https://img.youtube.com/vi/huTSPanXdqg/maxresdefault.jpg',
                'is_active': True,
                'created_at': datetime.now(timezone.utc)
            },
            {
                '_id': str(uuid.uuid4()),
                'title': 'Building Scalable Systems',
                'description': 'Architecture patterns and best practices for building systems that can handle millions of users.',
                'youtube_id': '9n8hP4dQEEw',
                'thumbnail_url': 'https://img.youtube.com/vi/9n8hP4dQEEw/maxresdefault.jpg',
                'is_active': True,
                'created_at': datetime.now(timezone.utc)
            },
            {
                '_id': str(uuid.uuid4()),
                'title': 'Design Thinking Workshop',
                'description': 'A hands-on workshop covering the design thinking methodology for solving complex problems.',
                'youtube_id': '5VCPyrU0qVQ',
                'thumbnail_url': 'https://img.youtube.com/vi/5VCPyrU0qVQ/maxresdefault.jpg',
                'is_active': True,
                'created_at': datetime.now(timezone.utc)
            }
        ]
        
        get_video_collection().insert_many(sample_videos)
        
        return jsonify({
            'message': f'Seeded {len(sample_videos)} videos successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Seed error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============== HEALTH CHECK ==============

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB connection
        mongo.db.command('ping')
        db_status = 'connected'
    except Exception as e:
        db_status = f'disconnected: {str(e)}'
    
    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }), 200


# ============== ERROR HANDLERS ==============

@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit exceeded"""
    logger.warning(f"Rate limit exceeded: {get_remote_address()}")
    return jsonify({
        'error': 'Rate limit exceeded',
        'retry_after': e.description
    }), 429


@app.errorhandler(401)
def unauthorized_handler(e):
    """Handle unauthorized access"""
    return jsonify({'error': 'Unauthorized'}), 401


@app.errorhandler(403)
def forbidden_handler(e):
    """Handle forbidden access"""
    return jsonify({'error': 'Forbidden'}), 403


# ============== MAIN ==============

if __name__ == '__main__':
    # Ensure indexes
    try:
        get_user_collection().create_index('email', unique=True)
        get_token_collection().create_index('jti', unique=True)
        get_token_collection().create_index(
            'revoked_at',
            expireAfterSeconds=7 * 24 * 60 * 60  # Auto-delete after 7 days
        )
        get_watch_history_collection().create_index([('user_id', 1), ('watched_at', -1)])
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)