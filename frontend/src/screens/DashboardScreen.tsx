/**
 * Dashboard Screen (Web)
 * Fetches and displays videos in a grid
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import { getDashboard } from '../api/videos';
import type { Video, DashboardResponse } from '../types';

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState<DashboardResponse['pagination'] | null>(null);

  const fetchVideos = useCallback(async (page: number = 1) => {
    try {
      const response = await getDashboard(page, 10);
      setVideos(response.videos);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to load videos');
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [fetchVideos]);

  const loadVideos = async () => {
    setIsLoading(true);
    await fetchVideos();
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchVideos();
    setIsRefreshing(false);
  };

  const handleVideoClick = (video: Video) => {
    navigate(`/video/${video.id}`, {
      state: {
        title: video.title,
        playbackToken: video.playback_token,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading videos...</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Featured Videos</h1>
        <button className="btn-secondary" onClick={onRefresh} disabled={isRefreshing} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiRefreshCw className={isRefreshing ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No videos available at the moment.</p>
          <button className="btn-primary" onClick={loadVideos}>Try Again</button>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className={`video-card stagger-${(index % 3) + 1}`}
              onClick={() => handleVideoClick(video)}
            >
              <div className="thumbnail-container">
                <img src={video.thumbnail_url} alt={video.title} loading="lazy" />
                <div className="play-overlay">
                  <div className="play-button">▶</div>
                </div>
              </div>
              <div className="video-info">
                <h3>{video.title}</h3>
                <p>{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Page {pagination.page} of {pagination.total_pages}
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }
        .video-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: transform var(--transition-bounce), box-shadow var(--transition-normal), border-color var(--transition-fast);
          animation: fadeIn 0.5s ease forwards;
        }
        .video-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.3);
          border-color: var(--border-focus);
        }
        .thumbnail-container {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
          background: #2a2a35;
        }
        .thumbnail-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .video-card:hover .thumbnail-container img {
          transform: scale(1.05);
        }
        .play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }
        .video-card:hover .play-overlay {
          opacity: 1;
        }
        .play-button {
          width: 60px;
          height: 60px;
          background: var(--accent-gradient);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          padding-left: 5px; /* Visual center for triangle */
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.4);
          transform: scale(0.8);
          transition: transform var(--transition-bounce);
        }
        .video-card:hover .play-button {
          transform: scale(1);
        }
        .video-info {
          padding: 1.25rem;
        }
        .video-info h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .video-info p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default DashboardScreen;
