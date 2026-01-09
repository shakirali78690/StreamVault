import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
    videoUrl: string | null | undefined;
    className?: string;
    onTimeUpdate?: (currentTime: number) => void;
    onPlay?: () => void;
    onPause?: () => void;
    autoplay?: boolean;
}

// URL type detection helpers
const isGoogleDriveUrl = (url: string): boolean => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
};

const isJWPlayerUrl = (url: string): boolean => {
    return url.includes('jwplatform.com') ||
        url.includes('cdn.jwplayer.com') ||
        url.includes('.jwp.') ||
        url.includes('jwpltx.com');
};

const isDirectVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.m3u8', '.mpd'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

const isEmbedUrl = (url: string): boolean => {
    // Check for various embed patterns
    return url.includes('/embed') ||
        url.includes('/e/') ||
        url.includes('player.') ||
        url.includes('iframe');
};

// Extract Google Drive file ID
const extractDriveId = (url: string): string => {
    const match = url.match(/\/d\/([^/]+)/);
    if (match) return match[1];
    // Check for export format
    const exportMatch = url.match(/id=([^&]+)/);
    if (exportMatch) return exportMatch[1];
    return url;
};

// Placeholder IDs to check
const PLACEHOLDER_IDS = ['1zcFHiGEOwgq2-j6hMqpsE0ov7qcIUqCd', 'PLACEHOLDER'];

// Declare global jwplayer type
declare global {
    interface Window {
        jwplayer: any;
    }
}

// JW Player Wrapper Component
interface JWPlayerWrapperProps {
    videoUrl: string;
    className?: string;
    onTimeUpdate?: (currentTime: number) => void;
    onPlay?: () => void;
    onPause?: () => void;
    autoplay?: boolean;
}

function JWPlayerWrapper({
    videoUrl,
    className = '',
    onTimeUpdate,
    onPlay,
    onPause,
    autoplay = false
}: JWPlayerWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerIdRef = useRef<string>(`jwplayer-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (!containerRef.current || !window.jwplayer) {
            console.warn('JW Player not loaded');
            return;
        }

        const playerId = playerIdRef.current;

        // Initialize JW Player with full settings
        const player = window.jwplayer(playerId).setup({
            file: videoUrl,
            width: '100%',
            height: '100%',
            aspectratio: '16:9',
            autostart: autoplay,
            controls: true,
            primary: 'html5',
            stretching: 'uniform',
            playbackRateControls: true, // Enable speed selector
            playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], // Speed options
            displaytitle: false,
            displaydescription: false,
            cast: {}, // Enable casting if available
            skin: {
                name: 'seven'
            }
        });

        // Attach event listeners
        if (onTimeUpdate) {
            player.on('time', (e: { position: number }) => {
                onTimeUpdate(e.position);
            });
        }
        if (onPlay) {
            player.on('play', onPlay);
        }
        if (onPause) {
            player.on('pause', onPause);
        }

        return () => {
            // Cleanup player on unmount
            try {
                window.jwplayer(playerId).remove();
            } catch (e) {
                // Player may already be destroyed
            }
        };
    }, [videoUrl, autoplay, onTimeUpdate, onPlay, onPause]);

    return (
        <div className={`w-full h-full ${className}`}>
            <div id={playerIdRef.current} ref={containerRef}></div>
        </div>
    );
}

export function VideoPlayer({
    videoUrl,
    className = '',
    onTimeUpdate,
    onPlay,
    onPause,
    autoplay = false
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playerType, setPlayerType] = useState<'drive' | 'jwplayer' | 'direct' | 'embed' | 'none'>('none');
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!videoUrl) {
            setPlayerType('none');
            setProcessedUrl(null);
            return;
        }

        // Check for placeholder
        const isPlaceholder = PLACEHOLDER_IDS.some(id => videoUrl.includes(id));
        if (isPlaceholder) {
            setPlayerType('none');
            setProcessedUrl(null);
            return;
        }

        // Check if it's a full URL or just a Drive ID
        const isAbsoluteUrl = videoUrl.startsWith('http://') || videoUrl.startsWith('https://');

        // If it's just a Google Drive ID (alphanumeric with dashes/underscores, typically 30-40 chars)
        const isDriveId = /^[a-zA-Z0-9_-]{20,60}$/.test(videoUrl);

        if (isDriveId && !isAbsoluteUrl) {
            // It's a plain Google Drive ID - convert to embed URL
            console.log('VideoPlayer: Detected Drive ID, converting to embed URL');
            setPlayerType('drive');
            setProcessedUrl(`https://drive.google.com/file/d/${videoUrl}/preview?autoplay=0&controls=1&modestbranding=1`);
            return;
        }

        // If not absolute URL and not a Drive ID, it's invalid
        if (!isAbsoluteUrl) {
            console.warn('VideoPlayer: Invalid URL format (must be absolute URL or Drive ID)', videoUrl);
            setPlayerType('none');
            setProcessedUrl(null);
            return;
        }

        // Detect URL type and process accordingly
        if (isGoogleDriveUrl(videoUrl)) {
            setPlayerType('drive');
            const driveId = extractDriveId(videoUrl);
            setProcessedUrl(`https://drive.google.com/file/d/${driveId}/preview?autoplay=0&controls=1&modestbranding=1`);
        } else if (isJWPlayerUrl(videoUrl)) {
            setPlayerType('jwplayer');
            // Use URL directly for JW Player embed or convert if needed
            setProcessedUrl(videoUrl);
        } else if (isDirectVideoUrl(videoUrl)) {
            setPlayerType('direct');
            setProcessedUrl(videoUrl);
        } else if (isEmbedUrl(videoUrl)) {
            setPlayerType('embed');
            setProcessedUrl(videoUrl);
        } else {
            // Default: treat as generic embed
            setPlayerType('embed');
            setProcessedUrl(videoUrl);
        }
    }, [videoUrl]);

    // Handle direct video events
    useEffect(() => {
        const video = videoRef.current;
        if (!video || playerType !== 'direct') return;

        const handleTimeUpdate = () => onTimeUpdate?.(video.currentTime);
        const handlePlay = () => onPlay?.();
        const handlePause = () => onPause?.();

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [playerType, onTimeUpdate, onPlay, onPause]);

    // Render placeholder when no video available
    if (playerType === 'none' || !processedUrl) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center text-white p-8 text-center bg-black ${className}`}>
                <div className="mb-6">
                    <svg className="w-20 h-20 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="round" strokeWidth={2} />
                    </svg>
                    <h3 className="text-2xl font-bold mb-2">Video Not Available</h3>
                    <p className="text-muted-foreground mb-6">
                        This content is not available yet. We're working on adding it!
                    </p>
                </div>
                <Link href="/request">
                    <Button variant="default" size="lg" className="gap-2">
                        Request This Content
                    </Button>
                </Link>
            </div>
        );
    }

    // Google Drive Player
    if (playerType === 'drive') {
        return (
            <iframe
                src={processedUrl}
                className={`w-full h-full border-0 ${className}`}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{ border: 'none' }}
            />
        );
    }

    // JW Player - Use iframe embed
    if (playerType === 'jwplayer') {
        // If it's already an embed URL, use directly
        // Otherwise, try to create proper embed URL
        let embedUrl = processedUrl;

        // Convert JW Player CDN URLs to embed format if needed
        if (!processedUrl.includes('/embed') && processedUrl.includes('cdn.jwplayer.com')) {
            // Try to extract media ID and create embed URL
            const mediaIdMatch = processedUrl.match(/\/([a-zA-Z0-9]{8})-/);
            if (mediaIdMatch) {
                const mediaId = mediaIdMatch[1];
                embedUrl = `https://cdn.jwplayer.com/players/${mediaId}-${mediaId}.html`;
            }
        }

        return (
            <iframe
                src={embedUrl}
                className={`w-full h-full border-0 ${className}`}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                style={{ border: 'none' }}
                scrolling="no"
            />
        );
    }

    // Direct Video (MP4, WebM, etc.) - Use JW Player
    if (playerType === 'direct') {
        return (
            <JWPlayerWrapper
                videoUrl={processedUrl!}
                className={className}
                onTimeUpdate={onTimeUpdate}
                onPlay={onPlay}
                onPause={onPause}
                autoplay={autoplay}
            />
        );
    }

    // Generic Embed (iframe for other players)
    return (
        <iframe
            src={processedUrl}
            className={`w-full h-full border-0 ${className}`}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            style={{ border: 'none' }}
            scrolling="no"
        />
    );
}

export default VideoPlayer;
