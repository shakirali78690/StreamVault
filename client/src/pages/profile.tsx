import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import { StreakDisplay } from '@/components/streak-display';
import { Loader2, Camera, User, Save, LogOut, FileVideo, Eye, Twitter, Instagram, Youtube, Heart, Trophy, Medal, Star, BarChart2, Target, X, Settings, icons } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SiTiktok, SiDiscord } from 'react-icons/si';
import { FavoritesPicker } from '@/components/favorites-picker';

export default function ProfilePage() {
    const [, navigate] = useLocation();
    const { user, isLoading: authLoading, isAuthenticated, updateProfile, uploadAvatar, logout } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [showFullAvatar, setShowFullAvatar] = useState(false);

    // Social links state
    const [socialLinks, setSocialLinks] = useState({
        twitter: user?.socialLinks?.twitter || '',
        instagram: user?.socialLinks?.instagram || '',
        youtube: user?.socialLinks?.youtube || '',
        tiktok: user?.socialLinks?.tiktok || '',
        discord: user?.socialLinks?.discord || '',
    });

    // Favorites state
    const [favorites, setFavorites] = useState({
        shows: user?.favorites?.shows || [],
        movies: user?.favorites?.movies || [],
        anime: user?.favorites?.anime || [],
    });

    // Sync state when user data loads
    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setBio(user.bio || '');
            setSocialLinks({
                twitter: user.socialLinks?.twitter || '',
                instagram: user.socialLinks?.instagram || '',
                youtube: user.socialLinks?.youtube || '',
                tiktok: user.socialLinks?.tiktok || '',
                discord: user.socialLinks?.discord || '',
            });
            setFavorites({
                shows: user.favorites?.shows || [],
                movies: user.favorites?.movies || [],
                anime: user.favorites?.anime || [],
            });
        }
    }, [user]);

    // Redirect if not logged in
    if (!authLoading && !isAuthenticated) {
        navigate('/login');
        return null;
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            await uploadAvatar(file);
            toast({
                title: 'Avatar updated!',
                description: 'Your profile picture has been updated.',
            });
        } catch (err: any) {
            toast({
                title: 'Upload failed',
                description: err.message || 'Failed to upload avatar',
                variant: 'destructive',
            });
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        setIsUpdating(true);
        try {
            // Filter out empty social links
            const filteredSocialLinks = Object.fromEntries(
                Object.entries(socialLinks).filter(([_, v]) => v.trim() !== '')
            );
            await updateProfile({
                username,
                bio,
                socialLinks: Object.keys(filteredSocialLinks).length > 0 ? filteredSocialLinks : undefined,
                favorites: (favorites.shows.length || favorites.movies.length || favorites.anime.length)
                    ? favorites
                    : undefined,
            });
            toast({
                title: 'Profile updated!',
                description: 'Your profile has been saved.',
            });
        } catch (err: any) {
            toast({
                title: 'Update failed',
                description: err.message || 'Failed to update profile',
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
        toast({
            title: 'Logged out',
            description: 'You have been logged out.',
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 pt-24 pb-20">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Hero Profile Card */}
                <Card className="border-primary/20 bg-card/60 backdrop-blur-sm overflow-hidden relative">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/5" />

                    <CardContent className="pt-8 relative z-10">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar Section */}
                            <div className="flex-shrink-0 mx-auto md:mx-0">
                                <div className="relative group">
                                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl cursor-pointer ring-2 ring-primary/20" onClick={() => user?.avatarUrl && setShowFullAvatar(true)}>
                                        <AvatarImage src={user?.avatarUrl || undefined} />
                                        <AvatarFallback className="text-4xl bg-primary/10">
                                            {user?.username ? getInitials(user.username) : <User className="h-12 w-12" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    {user?.avatarUrl && (
                                        <div
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
                                            onClick={() => setShowFullAvatar(true)}
                                        >
                                            <Eye className="h-8 w-8 text-white" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 rounded-full shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
                                            onClick={handleAvatarClick}
                                        >
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* User Stats & Info - Main Content */}
                            <div className="flex-1 w-full space-y-6">
                                <div className="text-center md:text-left space-y-1">
                                    <h2 className="text-3xl font-bold tracking-tight">{user?.username}</h2>
                                    <p className="text-muted-foreground">{user?.email}</p>
                                    {bio && <p className="text-sm italic pt-2 max-w-lg mx-auto md:mx-0 text-muted-foreground/80">{bio}</p>}
                                </div>

                                {/* XP Bar */}
                                <div className="space-y-2 max-w-md mx-auto md:mx-0">
                                    <div className="flex justify-between items-end px-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px] tracking-wider font-bold px-2 py-0.5">
                                                Level {user?.level || 1}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground font-medium">Master Viewer</span>
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">
                                            {(user?.xp || 0) % 1000} <span className="text-primary/60">/</span> 1000 XP
                                        </span>
                                    </div>
                                    <Progress value={((user?.xp || 0) % 1000) / 10} className="h-2.5 bg-secondary" />
                                </div>

                                {/* Streak Display - PLACED HERE AS REQUESTED */}
                                <div className="py-2">
                                    <StreakDisplay />
                                </div>

                                {/* Badges Section - Integrated */}
                                {user?.badges && (typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges).length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <Label className="uppercase text-xs tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                                            <Medal className="w-3 h-3" /> Recent Awards
                                        </Label>
                                        <div className="flex gap-3 overflow-x-auto p-2 pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent md:flex-wrap">
                                            {(typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges).map((badge: any) => {
                                                const iconName = badge.icon || 'Star';
                                                const PascalName = iconName.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
                                                const IconComponent = (icons as any)[PascalName] || (icons as any)[iconName] || Star;

                                                return (
                                                    <div key={badge.id} className="group relative flex flex-col items-center justify-center p-3 bg-gradient-to-b from-muted/50 to-muted/20 border border-white/5 hover:border-primary/20 rounded-xl min-w-[90px] w-[90px] h-[90px] transition-all hover:-translate-y-1 hover:shadow-lg" title={badge.description}>
                                                        {badge.imageUrl ? (
                                                            <img
                                                                src={badge.imageUrl}
                                                                alt={badge.name}
                                                                className="w-10 h-10 object-contain mb-2 drop-shadow-sm transition-transform group-hover:scale-110"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                                }}
                                                            />
                                                        ) : null}

                                                        <div className={`w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-2 group-hover:bg-yellow-500/20 transition-colors ${badge.imageUrl ? 'hidden' : ''}`}>
                                                            <IconComponent className="w-5 h-5" />
                                                        </div>

                                                        <span className="text-[10px] text-center font-medium leading-tight w-full px-1 text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                                                            {badge.name}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Gamification Navigation Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Achievements', icon: Trophy, color: 'text-purple-400', border: 'hover:border-purple-500', bg: 'hover:bg-purple-500/10', path: '/achievements' },
                        { label: 'Leaderboard', icon: Medal, color: 'text-yellow-400', border: 'hover:border-yellow-500', bg: 'hover:bg-yellow-500/10', path: '/leaderboard' },
                        { label: 'Polls', icon: BarChart2, color: 'text-blue-400', border: 'hover:border-blue-500', bg: 'hover:bg-blue-500/10', path: '/polls' },
                        { label: 'Challenges', icon: Target, color: 'text-red-400', border: 'hover:border-red-500', bg: 'hover:bg-red-500/10', path: '/challenges' },
                    ].map((item) => (
                        <Button
                            key={item.label}
                            variant="outline"
                            className={`h-24 flex flex-col items-center justify-center gap-2 border-muted hover:shadow-md transition-all ${item.border} ${item.bg}`}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon className={`h-8 w-8 ${item.color}`} />
                            <span className="font-semibold">{item.label}</span>
                        </Button>
                    ))}
                </div>

                {/* Profile Settings Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Profile Settings
                        </CardTitle>
                        <CardDescription>Update your personal information and preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />

                        {/* Basic Info */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Your username"
                                    minLength={3}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell the community about yourself..."
                                    rows={3}
                                    maxLength={500}
                                    className="resize-none"
                                />
                                <div className="flex justify-end">
                                    <span className="text-[10px] text-muted-foreground">{bio.length}/500</span>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4">
                            <Label className="text-base">Social Connections</Label>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#1DA1F2]/10 flex items-center justify-center flex-shrink-0">
                                        <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                                    </div>
                                    <Input
                                        value={socialLinks.twitter}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                                        placeholder="Twitter/X username"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                                        <Instagram className="h-5 w-5 text-pink-500" />
                                    </div>
                                    <Input
                                        value={socialLinks.instagram}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                                        placeholder="Instagram username"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center flex-shrink-0">
                                        <Youtube className="h-5 w-5 text-red-600" />
                                    </div>
                                    <Input
                                        value={socialLinks.youtube}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                                        placeholder="YouTube channel"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <SiTiktok className="h-5 w-5" />
                                    </div>
                                    <Input
                                        value={socialLinks.tiktok}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                                        placeholder="TikTok username"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#5865F2]/10 flex items-center justify-center flex-shrink-0">
                                        <SiDiscord className="h-5 w-5 text-[#5865F2]" />
                                    </div>
                                    <Input
                                        value={socialLinks.discord}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, discord: e.target.value }))}
                                        placeholder="Discord username"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Favorites */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-base flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                                    Favorite Content
                                </Label>
                            </div>
                            <FavoritesPicker
                                favorites={favorites}
                                onFavoritesChange={setFavorites}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-4 border-t">
                            <Button onClick={handleSave} disabled={isUpdating} className="w-full md:w-auto md:self-end min-w-[150px]">
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Profile
                                    </>
                                )}
                            </Button>

                            <div className="mt-8 pt-8 border-t border-destructive/10">
                                <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
                                <Button
                                    variant="destructive"
                                    onClick={handleLogout}
                                    className="w-full md:w-auto hover:bg-destructive/90 border-destructive/30"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Full Avatar Preview */}
            {
                showFullAvatar && user?.avatarUrl && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowFullAvatar(false)}
                    >
                        <img
                            src={user.avatarUrl}
                            alt={user.username}
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl scale-100 hover:scale-[1.02] transition-transform duration-300"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                            variant="ghost"
                            className="absolute top-4 right-4 text-white hover:bg-white/20"
                            onClick={() => setShowFullAvatar(false)}
                        >
                            <X className="h-6 w-6" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>
                )
            }
        </div >
    );
}
