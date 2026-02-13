/**
 * Video API Service
 * Thin client - just API calls, no business logic
 */

import apiClient from './client';
import { 
  Video, 
  StreamData, 
  DashboardResponse,
  WatchProgress 
} from '../types';

/**
 * Get dashboard videos
 */
export const getDashboard = async (page: number = 1, perPage: number = 2): Promise<DashboardResponse> => {
  const response = await apiClient.axios.get<DashboardResponse>('/dashboard', {
    params: { page, per_page: perPage },
  });
  return response.data;
};

/**
 * Get video stream URL with secure token
 */
export const getVideoStream = async (videoId: string, token: string): Promise<StreamData> => {
  const response = await apiClient.axios.get<StreamData>(`/video/${videoId}/stream`, {
    params: { token },
  });
  return response.data;
};

/**
 * Track video watch progress
 */
export const trackWatchProgress = async (
  videoId: string, 
  progress: WatchProgress
): Promise<void> => {
  await apiClient.axios.post(`/video/${videoId}/watch`, progress);
};