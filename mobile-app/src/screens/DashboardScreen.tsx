/**
 * Dashboard Screen
 * Shows video tiles fetched from backend
 * Thin client - just renders data from API
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getDashboard } from '../api/videos';
import { Video, DashboardResponse } from '../types';

const { width } = Dimensions.get('window');
const TILE_WIDTH = (width - 48) / 2;
const TILE_HEIGHT = TILE_WIDTH * 0.75;

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'MainTabs'>;
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState<DashboardResponse['pagination'] | null>(null);

  /**
   * Fetch videos from API
   */
  const fetchVideos = useCallback(async (page: number = 1): Promise<void> => {
    try {
      const response = await getDashboard(page, 2);
      setVideos(response.videos);
      setPagination(response.pagination);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load videos';
      Alert.alert('Error', errorMessage);
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    loadVideos();
  }, []);

  /**
   * Load videos with loading state
   */
  const loadVideos = async (): Promise<void> => {
    setIsLoading(true);
    await fetchVideos();
    setIsLoading(false);
  };

  /**
   * Pull to refresh
   */
  const onRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    await fetchVideos();
    setIsRefreshing(false);
  };

  /**
   * Handle video tile press
   */
  const handleVideoPress = (video: Video): void => {
    navigation.navigate('VideoPlayer', {
      videoId: video.id,
      title: video.title,
      playbackToken: video.playback_token,
    });
  };

  /**
   * Render a video tile
   */
  const renderVideoTile = ({ item }: { item: Video }): React.ReactElement => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => handleVideoPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnail_url }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.tileContent}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  /**
   * Render empty state
   */
  if (videos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No videos available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadVideos}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={renderVideoTile}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <Text style={styles.headerText}>Featured Videos</Text>
        }
        ListFooterComponent={
          pagination && pagination.total_pages > 1 ? (
            <View style={styles.paginationInfo}>
              <Text style={styles.paginationText}>
                Page {pagination.page} of {pagination.total_pages}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  tile: {
    width: TILE_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: '100%',
    height: TILE_HEIGHT,
    backgroundColor: '#e0e0e0',
  },
  tileContent: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paginationInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  paginationText: {
    color: '#666',
    fontSize: 14,
  },
});

export default DashboardScreen;