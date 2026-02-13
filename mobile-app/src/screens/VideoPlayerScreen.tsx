/**
 * Video Player Screen
 * Plays videos using secure stream from backend
 * Thin client - no direct YouTube URLs, uses backend wrapper
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  AppState,
  AppStateStatus,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import YoutubeIframe from 'react-native-youtube-iframe';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getVideoStream, trackWatchProgress } from '../api/videos';
import { StreamData, WatchProgress } from '../types';

const { width, height } = Dimensions.get('window');
const VIDEO_HEIGHT = (width * 9) / 16;

type VideoPlayerScreenProps = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'VideoPlayer'>;
  route: RouteProp<AppStackParamList, 'VideoPlayer'>;
};

const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({ navigation, route }) => {
  const { videoId, title, playbackToken } = route.params;
  
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const playerRef = useRef<any>(null);
  const watchStartTime = useRef<number>(0);
  const lastReportedTime = useRef<number>(0);
  const appState = useRef(AppState.currentState);

  /**
   * Fetch stream data from backend
   */
  useEffect(() => {
    fetchStreamData();
  }, []);

  /**
   * Fetch secure stream data
   */
  const fetchStreamData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getVideoStream(videoId, playbackToken);
      setStreamData(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load video';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - pause video
        setIsPlaying(false);
        // Report progress before going background
        reportWatchProgress(currentTime, false);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [currentTime]);

  /**
   * Report watch progress to backend
   */
  const reportWatchProgress = useCallback(async (
    progressSeconds: number, 
    completed: boolean = false
  ): Promise<void> => {
    // Don't report if progress hasn't changed significantly (5 seconds threshold)
    if (Math.abs(progressSeconds - lastReportedTime.current) < 5 && !completed) {
      return;
    }

    try {
      const progress: WatchProgress = {
        progress_seconds: Math.floor(progressSeconds),
        duration_seconds: duration > 0 ? Math.floor(duration) : undefined,
        completed,
      };
      await trackWatchProgress(videoId, progress);
      lastReportedTime.current = progressSeconds;
    } catch (err) {
      console.log('Failed to report watch progress:', err);
    }
  }, [videoId, duration]);

  /**
   * Handle video ready
   */
  const handleReady = (): void => {
    setIsLoading(false);
    watchStartTime.current = Date.now();
  };

  /**
   * Handle playback state change
   */
  const handleStateChange = useCallback((state: string): void => {
    switch (state) {
      case 'playing':
        setIsPlaying(true);
        break;
      case 'paused':
        setIsPlaying(false);
        // Report progress when paused
        reportWatchProgress(currentTime, false);
        break;
      case 'ended':
        setIsPlaying(false);
        reportWatchProgress(currentTime, true);
        break;
    }
  }, [currentTime, reportWatchProgress]);

  /**
   * Handle current time update
   */
  const handleProgress = useCallback((seconds: number): void => {
    setCurrentTime(seconds);
    // Report progress every 30 seconds
    if (Math.floor(seconds) % 30 === 0) {
      reportWatchProgress(seconds, false);
    }
  }, [reportWatchProgress]);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = (): void => {
    setIsPlaying(!isPlaying);
  };

  /**
   * Toggle mute
   */
  const toggleMute = (): void => {
    setIsMuted(!isMuted);
  };

  /**
   * Extract YouTube video ID from embed URL
   */
  const getYoutubeVideoId = (embedUrl: string): string => {
    const match = embedUrl.match(/embed\/([^?]+)/);
    return match ? match[1] : '';
  };

  /**
   * Render loading state
   */
  if (isLoading && !streamData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error || !streamData) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>{error || 'Failed to load video'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStreamData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const youtubeId = getYoutubeVideoId(streamData.stream.embed_url);

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <View style={styles.playerContainer}>
        <YoutubeIframe
          ref={playerRef}
          height={VIDEO_HEIGHT}
          width={width}
          videoId={youtubeId}
          play={isPlaying}
          mute={isMuted}
          onReady={handleReady}
          onChangeState={handleStateChange}
          onProgress={({ currentTime: time }) => handleProgress(time)}
          onError={(errorCode) => {
            console.log('YouTube Error:', errorCode);
            setError('Failed to play video');
          }}
          initialPlayerParams={{
            controls: true,
            modestbranding: true,
            rel: false,
          }}
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>

      {/* Video Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.videoTitle}>{streamData.title}</Text>
        <Text style={styles.videoDescription}>{streamData.description}</Text>
      </View>

      {/* Custom Controls (optional enhancement) */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
          <Icon 
            name={isPlaying ? 'pause' : 'play-arrow'} 
            size={28} 
            color="#6200ee" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Icon 
            name={isMuted ? 'volume-off' : 'volume-up'} 
            size={28} 
            color="#6200ee" 
          />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Format seconds to MM:SS
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  playerContainer: {
    width: width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  controlButton: {
    padding: 8,
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoPlayerScreen;