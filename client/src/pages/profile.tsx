import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, User, Save, LogOut, FileVideo, Eye, Twitter, Instagram, Youtube, Heart } from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 pt-24">
            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Manage your account settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 cursor-pointer" onClick={() => user?.avatarUrl && setShowFullAvatar(true)}>
                                    <AvatarImage src={user?.avatarUrl || undefined} />
                                    <AvatarFallback className="text-2xl bg-primary/10">
                                        {user?.username ? getInitials(user.username) : <User className="h-10 w-10" />}
                                    </AvatarFallback>
                                </Avatar>
                                {user?.avatarUrl && (
                                    <div
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        onClick={() => setShowFullAvatar(true)}
                                    >
                                        <Eye className="h-6 w-6 text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{user?.username}</h3>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                                <div className="flex gap-2 mt-2">
                                    <Button variant="outline" size="sm" onClick={handleAvatarClick}>
                                        <Camera className="h-4 w-4 mr-1" />
                                        Change
                                    </Button>
                                    {user?.avatarUrl && (
                                        <Button variant="ghost" size="sm" onClick={() => setShowFullAvatar(true)}>
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                        </Button>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>
                        </div>

                        {/* Username */}
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

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {bio.length}/500 characters
                            </p>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4">
                            <Label>Social Links</Label>
                            <div className="grid gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-[#1DA1F2]/10 flex items-center justify-center">
                                        <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                                    </div>
                                    <Input
                                        value={socialLinks.twitter}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                                        placeholder="Twitter/X username"
                                        className="flex-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                                        <Instagram className="h-5 w-5 text-pink-500" />
                                    </div>
                                    <Input
                                        value={socialLinks.instagram}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                                        placeholder="Instagram username"
                                        className="flex-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-[#FF0000]/10 flex items-center justify-center">
                                        <Youtube className="h-5 w-5 text-[#FF0000]" />
                                    </div>
                                    <Input
                                        value={socialLinks.youtube}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                                        placeholder="YouTube channel URL or username"
                                        className="flex-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center">
                                        <SiTiktok className="h-5 w-5" />
                                    </div>
                                    <Input
                                        value={socialLinks.tiktok}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                                        placeholder="TikTok username"
                                        className="flex-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-[#5865F2]/10 flex items-center justify-center">
                                        <SiDiscord className="h-5 w-5 text-[#5865F2]" />
                                    </div>
                                    <Input
                                        value={socialLinks.discord}
                                        onChange={(e) => setSocialLinks(prev => ({ ...prev, discord: e.target.value }))}
                                        placeholder="Discord username"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Favorites */}
                        <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                                <Heart className="h-4 w-4 text-red-500" />
                                Favorite Content
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Select up to 5 favorites in each category. These will be displayed on your profile.
                            </p>
                            <FavoritesPicker
                                favorites={favorites}
                                onFavoritesChange={setFavorites}
                            />
                        </div>

                        {/* Save Button */}
                        <Button onClick={handleSave} disabled={isUpdating} className="w-full">
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Logout Card */}
                <Card className="border-destructive/20">
                    <CardContent className="pt-6">
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="w-full"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Full Avatar Preview - Click anywhere to close */}
            {showFullAvatar && user?.avatarUrl && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
                    onClick={() => setShowFullAvatar(false)}
                >
                    <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
