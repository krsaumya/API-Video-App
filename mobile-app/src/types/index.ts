/**
 * Type definitions for the Video App
 */

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

// Video Types
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  playback_token: string;
  created_at?: string;
}

export interface StreamData {
  video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  stream: {
    type: string;
    embed_url: string;
    poster_url: string;
  };
}

export interface DashboardResponse {
  videos: Video[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// API Types
export interface ApiError {
  error: string;
}

export interface WatchProgress {
  progress_seconds: number;
  duration_seconds?: number;
  completed?: boolean;
}