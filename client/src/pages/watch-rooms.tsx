import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { io, Socket } from 'socket.io-client';
import {
    Users,
    Lock,
    Globe,
    Play,
    Tv,
    Film,
    Sparkles,
    RefreshCw,
    Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SEO } from '@/components/seo';

interface WatchRoom {
    id: string;
    code: string;
    hostUsername: string;
    contentType: 'show' | 'movie' | 'anime';
    contentId: string;
    contentTitle: string;
    contentPoster?: string;
    episodeId?: string;
    episodeTitle?: string;
    isPublic: boolean;
    hasPassword: boolean;
    userCount: number;
    createdAt: string;
}

export default function WatchRooms() {
    const [, setLocation] = useLocation();
    const [rooms, setRooms] = useState<WatchRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<WatchRoom | null>(null);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // Fetch rooms via HTTP API
    const { data: roomsData, refetch } = useQuery<WatchRoom[]>({
        queryKey: ['/api/watch-rooms'],
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    useEffect(() => {
        if (roomsData) {
            setRooms(roomsData);
            setIsLoading(false);
        }
    }, [roomsData]);

    // Alternative: Connect via socket for real-time updates
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socketUrl = `${protocol}//${window.location.host}`;

        const socket = io(`${socketUrl}/watch-together`, {
            path: '/watch-together-socket',
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('rooms:list');
        });

        socket.on('rooms:list', (roomsList: WatchRoom[]) => {
            setRooms(roomsList);
            setIsLoading(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleJoinRoom = (room: WatchRoom) => {
        if (room.hasPassword) {
            setSelectedRoom(room);
            setPassword('');
            setPasswordError('');
            setShowPasswordModal(true);
        } else {
            // Direct join for public rooms
            setLocation(`/watch-together/${room.code}`);
        }
    };

    const handlePasswordSubmit = () => {
        if (!password.trim()) {
            setPasswordError('Please enter a password');
            return;
        }

        // Navigate with password in state
        setLocation(`/watch-together/${selectedRoom?.code}?password=${encodeURIComponent(password)}`);
        setShowPasswordModal(false);
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'show':
                return <Tv className="w-4 h-4" />;
            case 'movie':
                return <Film className="w-4 h-4" />;
            case 'anime':
                return <Sparkles className="w-4 h-4" />;
            default:
                return <Tv className="w-4 h-4" />;
        }
    };

    const getContentTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            show: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            movie: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            anime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        };
        return colors[type] || colors.show;
    };

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title="Watch Rooms | StreamVault"
                description="Join live watch parties and watch shows and movies together with friends"
            />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Users className="w-8 h-8 text-primary" />
                            Watch Rooms
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Join live watch sessions with other viewers
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/create-room">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Room
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => refetch()}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Room Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <div className="aspect-video bg-muted" />
                                <CardContent className="p-4">
                                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Users className="w-16 h-16 text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No Active Watch Rooms</h2>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            There aren't any active watch rooms right now. Be the first to create one!
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/create-room">
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Create New Room
                                </Button>
                            </Link>
                            <Link href="/browse/shows">
                                <Button variant="outline" className="gap-2">
                                    <Tv className="w-4 h-4" />
                                    Browse Shows
                                </Button>
                            </Link>
                            <Link href="/browse/movies">
                                <Button variant="outline" className="gap-2">
                                    <Film className="w-4 h-4" />
                                    Browse Movies
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {rooms.map((room) => (
                            <Card
                                key={room.id}
                                className="group overflow-hidden hover:border-primary transition-all duration-300 cursor-pointer"
                                onClick={() => handleJoinRoom(room)}
                            >
                                {/* Poster */}
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                    {room.contentPoster ? (
                                        <img
                                            src={room.contentPoster}
                                            alt={room.contentTitle}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {getContentIcon(room.contentType)}
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                    {/* Status Badges */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <Badge className={getContentTypeBadge(room.contentType)}>
                                            {getContentIcon(room.contentType)}
                                            <span className="ml-1 capitalize">{room.contentType}</span>
                                        </Badge>
                                    </div>

                                    <div className="absolute top-3 right-3">
                                        {room.isPublic ? (
                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                <Globe className="w-3 h-3 mr-1" />
                                                Public
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                                <Lock className="w-3 h-3 mr-1" />
                                                Private
                                            </Badge>
                                        )}
                                    </div>

                                    {/* User Count */}
                                    <div className="absolute bottom-3 right-3">
                                        <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm">
                                            <Users className="w-3 h-3 mr-1" />
                                            {room.userCount} watching
                                        </Badge>
                                    </div>

                                    {/* Play Button on Hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                                            <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="p-4">
                                    {/* Title */}
                                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                        {room.contentTitle}
                                    </h3>

                                    {/* Episode Info */}
                                    {room.episodeTitle && (
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                            {room.episodeTitle}
                                        </p>
                                    )}

                                    {/* Host Info */}
                                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="text-xs font-medium text-primary">
                                                {room.hostUsername.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span>Hosted by <span className="text-foreground">{room.hostUsername}</span></span>
                                    </div>

                                    {/* Room Code */}
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Room Code:</span>
                                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                            {room.code}
                                        </code>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Password Modal */}
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-orange-400" />
                            Private Room
                        </DialogTitle>
                        <DialogDescription>
                            Enter the password to join "{selectedRoom?.contentTitle}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            type="password"
                            placeholder="Enter room password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setPasswordError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                        />
                        {passwordError && (
                            <p className="text-sm text-destructive">{passwordError}</p>
                        )}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowPasswordModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handlePasswordSubmit}
                            >
                                Join Room
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
