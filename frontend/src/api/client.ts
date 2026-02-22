/**
 * API Client with token refresh logic and interceptors
 * Thin client - no business logic, just API calls
 */

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens, ApiError } from '../types';

// API Configuration
// Using standard localhost or the live URL
const API_BASE_URL = 'https://api-video-app-sh6u.vercel.app/api';

// Storage keys
const STORAGE_KEYS = {
    ACCESS_TOKEN: '@access_token',
    REFRESH_TOKEN: '@refresh_token',
    TOKEN_EXPIRY: '@token_expiry',
};

class ApiClient {
    private client: AxiosInstance;
    private isRefreshing: boolean = false;
    private refreshSubscribers: Array<(token: string) => void> = [];

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    /**
     * Setup request and response interceptors
     */
    private setupInterceptors(): void {
        // Request interceptor - add auth token
        this.client.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                const token = await this.getAccessToken();
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - handle token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<ApiError>) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                // If 401 and not already retrying
                if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
                    // Check if it's a token expiration (not invalid credentials)
                    const errorMessage = error.response.data?.error;
                    if (errorMessage === 'Invalid credentials') {
                        return Promise.reject(error);
                    }

                    if (this.isRefreshing) {
                        // Wait for token refresh
                        return new Promise((resolve) => {
                            this.refreshSubscribers.push((token: string) => {
                                if (originalRequest.headers) {
                                    originalRequest.headers.Authorization = `Bearer ${token}`;
                                }
                                resolve(this.client(originalRequest));
                            });
                        });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        const newToken = await this.refreshAccessToken();
                        this.onTokenRefreshed(newToken);
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        }
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, logout user
                        await this.clearTokens();
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Notify subscribers that token has been refreshed
     */
    private onTokenRefreshed(token: string): void {
        this.refreshSubscribers.forEach((callback) => callback(token));
        this.refreshSubscribers = [];
    }

    // ============== TOKEN MANAGEMENT ==============

    async getAccessToken(): Promise<string | null> {
        return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }

    async getRefreshToken(): Promise<string | null> {
        return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }

    async setTokens(tokens: AuthTokens): Promise<void> {
        const expiryTime = Date.now() + tokens.expires_in * 1000;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    }

    async clearTokens(): Promise<void> {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    }

    async isTokenExpired(): Promise<boolean> {
        const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
        if (!expiry) return true;
        // Consider token expired 60 seconds before actual expiry
        return Date.now() + 60000 > parseInt(expiry, 10);
    }

    /**
     * Refresh access token using refresh token
     */
    private async refreshAccessToken(): Promise<string> {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
                'Authorization': `Bearer ${refreshToken}`,
            },
        });

        const { access_token, expires_in } = response.data;
        const expiryTime = Date.now() + expires_in * 1000;

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());

        return access_token;
    }

    // ============== API METHODS ==============

    get axios(): AxiosInstance {
        return this.client;
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const token = await this.getAccessToken();
        return !!token;
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
