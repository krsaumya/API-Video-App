/**
 * Video Player Screen (Web)
 * Plays videos using secure stream from backend
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import { getVideoStream, trackWatchProgress } from '../api/videos';
import type { StreamData, WatchProgress } from '../types';

const VideoPlayerScreen = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { title?: string; playbackToken?: string } | null;

    const videoId = id || '';
    // const initialTitle = state?.title || 'Video Player';
    const playbackToken = state?.playbackToken || '';

    const [streamData, setStreamData] = useState<StreamData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Progress tracking refs
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastReportedTime = useRef<number>(0);
    const durationRef = useRef<number>(0);

    const fetchStreamData = useCallback(async () => {
        if (!videoId || !playbackToken) {
            setError('Missing video configuration');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const data = await getVideoStream(videoId, playbackToken);
            setStreamData(data);
        } catch (err: any) {
            console.error('Failed to load video stream', err);
            setError(err.response?.data?.error || 'Failed to load video');
        } finally {
            setIsLoading(false);
        }
    }, [videoId, playbackToken]);

    useEffect(() => {
        fetchStreamData();
    }, [fetchStreamData]);

    const reportWatchProgress = useCallback(async (
        progressSeconds: number,
        completed: boolean = false
    ) => {
        if (Math.abs(progressSeconds - lastReportedTime.current) < 5 && !completed) {
            return;
        }

        try {
            const progress: WatchProgress = {
                progress_seconds: Math.floor(progressSeconds),
                duration_seconds: durationRef.current > 0 ? Math.floor(durationRef.current) : undefined,
                completed,
            };
            await trackWatchProgress(videoId, progress);
            lastReportedTime.current = progressSeconds;
        } catch (err) {
            console.log('Failed to report watch progress:', err);
        }
    }, [videoId]);

    // Handle YouTube iframe messages for progress tracking
    useEffect(() => {
        const handleMessage = (_event: MessageEvent) => {
            // In a real implementation, you'd parse YouTube Player API postMessages
            // to track progress. For this web migration, we'll set up a mock timer
            // if it's a generic iframe, or ideally use the YT Iframe API.
        };

        window.addEventListener('message', handleMessage);

        // Simulate generic progress tracking
        const interval = setInterval(() => {
            if (!isLoading && !error && streamData) {
                lastReportedTime.current += 5; // Simulate 5s of watching
                reportWatchProgress(lastReportedTime.current, false);
            }
        }, 5000);

        return () => {
            window.removeEventListener('message', handleMessage);
            clearInterval(interval);
        };
    }, [isLoading, error, streamData, reportWatchProgress]);

    if (isLoading && !streamData) {
        return (
            <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading video...</p>
            </div>
        );
    }

    if (error || !streamData) {
        return (
            <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <FiAlertCircle style={{ fontSize: '4rem', color: 'var(--danger)', marginBottom: '1rem' }} />
                <h2 style={{ marginBottom: '0.5rem' }}>Playback Error</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</p>
                <button className="btn-primary" onClick={fetchStreamData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiRefreshCw /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

            <button
                onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}
            >
                <FiArrowLeft /> Back to Dashboard
            </button>

            <div className="player-wrapper glass-panel">
                <div className="video-container">
                    <iframe
                        ref={iframeRef}
                        src={streamData.stream.embed_url}
                        title={streamData.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>

            <div className="video-details" style={{ marginTop: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{streamData.title}</h1>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{streamData.description}</p>
                </div>
            </div>

            <style>{`
        .player-wrapper {
          overflow: hidden;
          padding: 0;
          border: 1px solid var(--border-light);
        }
        .video-container {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
          height: 0;
          overflow: hidden;
          background: #000;
        }
        .video-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
      `}</style>
        </div>
    );
};

export default VideoPlayerScreen;
