import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'simple-peer';
import type { Socket } from 'socket.io-client';

interface VoiceChatOptions {
    socket: Socket | null;
    roomUsers: { id: string; username: string }[];
    currentUserId: string | null;
    enabled?: boolean;
}

interface PeerConnection {
    peerId: string;
    peer: Peer.Instance;
    stream?: MediaStream;
}

export function useVoiceChat({ socket, roomUsers, currentUserId, enabled = true }: VoiceChatOptions) {
    const [isMuted, setIsMuted] = useState(true);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
    const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, PeerConnection>>(new Map());
    const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Initialize microphone
    const initMicrophone = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            localStreamRef.current = stream;

            // Setup audio analyzer for speaking detection
            try {
                audioContextRef.current = new AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;

                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);

                // Start speaking detection loop
                const detectSpeaking = () => {
                    if (!analyserRef.current || isMuted) {
                        setIsSpeaking(false);
                        animationFrameRef.current = requestAnimationFrame(detectSpeaking);
                        return;
                    }

                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(dataArray);

                    // Calculate average volume
                    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    const speaking = average > 20; // Threshold
                    setIsSpeaking(speaking);

                    animationFrameRef.current = requestAnimationFrame(detectSpeaking);
                };
                detectSpeaking();
            } catch (analyserError) {
                console.warn('Audio analyzer not supported:', analyserError);
            }

            // Start muted
            stream.getAudioTracks().forEach(track => {
                track.enabled = false;
            });

            setIsVoiceEnabled(true);
            setError(null);
            console.log('🎤 Microphone initialized');
            return stream;
        } catch (err: any) {
            console.error('Failed to get microphone:', err);
            setError(err.message || 'Failed to access microphone');
            return null;
        }
    }, [isMuted]);

    // Create a peer connection
    const createPeer = useCallback((targetId: string, initiator: boolean, stream: MediaStream) => {
        if (!socket) {
            console.warn('Cannot create peer: socket not connected');
            return null;
        }

        try {
            console.log(`🔗 Creating peer connection to ${targetId}, initiator: ${initiator}`);

            const peer = new Peer({
                initiator,
                trickle: true,
                stream,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peer.on('signal', (signal) => {
                socket?.emit('voice:signal', { targetId, signal });
            });

            peer.on('stream', (remoteStream) => {
                console.log(`🔊 Received stream from ${targetId}`, remoteStream);
                console.log('🔊 Audio tracks:', remoteStream.getAudioTracks());

                // Create audio element for this peer and attach to DOM
                let audio = audioElementsRef.current.get(targetId);
                if (!audio) {
                    audio = document.createElement('audio');
                    audio.id = `remote-audio-${targetId}`;
                    audio.autoplay = true;
                    audio.setAttribute('playsinline', 'true');
                    audio.controls = false;
                    // Append to document body for browsers that require it
                    document.body.appendChild(audio);
                    audioElementsRef.current.set(targetId, audio);
                }

                audio.srcObject = remoteStream;
                audio.volume = 1.0;

                // Try to play, handle autoplay restrictions
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => console.log(`🔊 Audio playing for ${targetId}`))
                        .catch(err => {
                            console.error('Audio play failed:', err);
                            // User interaction needed - will work after they click something
                        });
                }
            });

            peer.on('connect', () => {
                console.log(`✅ Connected to peer ${targetId}`);
                setConnectedPeers(prev => {
                    const newSet = new Set(prev);
                    newSet.add(targetId);
                    return Array.from(newSet);
                });
            });

            peer.on('close', () => {
                console.log(`❌ Disconnected from peer ${targetId}`);
                setConnectedPeers(prev => prev.filter(id => id !== targetId));
                peersRef.current.delete(targetId);

                const audio = audioElementsRef.current.get(targetId);
                if (audio) {
                    audio.srcObject = null;
                    audio.remove(); // Remove from DOM
                    audioElementsRef.current.delete(targetId);
                }
            });

            peer.on('error', (err) => {
                console.error(`Peer error with ${targetId}:`, err);
            });

            peersRef.current.set(targetId, { peerId: targetId, peer });
            return peer;
        } catch (err) {
            console.error('Failed to create peer connection:', err);
            return null;
        }
    }, [socket]);

    // Handle incoming signals
    useEffect(() => {
        if (!socket || !isVoiceEnabled || !localStreamRef.current) return;

        const handleSignal = ({ fromId, signal }: { fromId: string; signal: any }) => {
            console.log(`📡 Received signal from ${fromId}`);

            let peerConnection = peersRef.current.get(fromId);

            if (!peerConnection) {
                // Create new peer for incoming connection
                const peer = createPeer(fromId, false, localStreamRef.current!);
                if (!peer) {
                    console.warn('Failed to create peer for incoming connection');
                    return;
                }
                peerConnection = { peerId: fromId, peer };
                peersRef.current.set(fromId, peerConnection);
            }

            try {
                peerConnection.peer.signal(signal);
            } catch (err) {
                console.error('Error signaling peer:', err);
            }
        };

        socket.on('voice:signal', handleSignal);

        return () => {
            socket.off('voice:signal', handleSignal);
        };
    }, [socket, isVoiceEnabled, createPeer]);

    // Connect to other users when voice is enabled
    useEffect(() => {
        if (!isVoiceEnabled || !localStreamRef.current || !currentUserId) return;

        // Connect to other users (only initiate if our ID is "greater" to avoid duplicate connections)
        roomUsers.forEach(user => {
            if (user.id !== currentUserId && !peersRef.current.has(user.id)) {
                if (currentUserId > user.id) {
                    createPeer(user.id, true, localStreamRef.current!);
                }
            }
        });
    }, [roomUsers, isVoiceEnabled, currentUserId, createPeer]);

    // Emit speaking state to server for other users to see
    useEffect(() => {
        if (!socket || !isVoiceEnabled) return;
        socket.emit('voice:speaking', { isSpeaking });
    }, [socket, isSpeaking, isVoiceEnabled]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) return;

        const newMuted = !isMuted;
        localStreamRef.current.getAudioTracks().forEach(track => {
            track.enabled = !newMuted;
        });
        setIsMuted(newMuted);

        // Notify server
        socket?.emit('voice:toggle-mute', { isMuted: newMuted });

        console.log(newMuted ? '🔇 Muted' : '🔊 Unmuted');
    }, [isMuted, socket]);

    // Start voice chat
    const startVoice = useCallback(async () => {
        const stream = await initMicrophone();
        if (stream) {
            // Connect to all other users
            roomUsers.forEach(user => {
                if (user.id !== currentUserId && !peersRef.current.has(user.id)) {
                    createPeer(user.id, true, stream);
                }
            });
        }
    }, [initMicrophone, roomUsers, currentUserId, createPeer]);

    // Stop voice chat
    const stopVoice = useCallback(() => {
        // Stop all audio tracks
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;

        // Close all peer connections
        peersRef.current.forEach(({ peer }) => {
            peer.destroy();
        });
        peersRef.current.clear();

        // Clean up audio elements
        audioElementsRef.current.forEach(audio => {
            audio.srcObject = null;
        });
        audioElementsRef.current.clear();

        setIsVoiceEnabled(false);
        setConnectedPeers([]);
        setIsMuted(true);

        console.log('🔇 Voice chat stopped');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopVoice();
        };
    }, [stopVoice]);

    return {
        isMuted,
        isVoiceEnabled,
        isSpeaking,
        connectedPeers,
        error,
        toggleMute,
        startVoice,
        stopVoice
    };
}
