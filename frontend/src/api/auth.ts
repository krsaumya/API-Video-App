/**
 * Authentication API Service
 * Thin client - just API calls, no business logic
 */

import apiClient from './client';
import type {
    LoginCredentials,
    SignupCredentials,
    AuthResponse,
    User
} from '../types';

/**
 * Register a new user
 */
export const signup = async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response = await apiClient.axios.post<AuthResponse>('/auth/signup', credentials);
    await apiClient.setTokens(response.data.tokens);
    return response.data;
};

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.axios.post<AuthResponse>('/auth/login', credentials);
    await apiClient.setTokens(response.data.tokens);
    return response.data;
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
    const response = await apiClient.axios.get<User>('/auth/me');
    return response.data;
};

/**
 * Logout user and revoke token
 */
export const logout = async (): Promise<void> => {
    try {
        await apiClient.axios.post('/auth/logout');
    } finally {
        await apiClient.clearTokens();
    }
};

/**
 * Refresh access token manually
 */
export const refreshToken = async (): Promise<string> => {
    const refreshToken = await apiClient.getRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await apiClient.axios.post<{ access_token: string; expires_in: number }>(
        '/auth/refresh',
        {},
        {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
        }
    );

    const { access_token, expires_in } = response.data;
    const expiryTime = Date.now() + expires_in * 1000;

    localStorage.setItem('@access_token', access_token);
    localStorage.setItem('@token_expiry', expiryTime.toString());

    return access_token;
};
