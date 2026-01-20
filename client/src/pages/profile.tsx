import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, User, Save, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
    const [, navigate] = useLocation();
    const { user, isLoading: authLoading, isAuthenticated, updateProfile, uploadAvatar, logout } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
            await updateProfile({ username, bio });
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
                                <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                                    <AvatarImage src={user?.avatarUrl || undefined} />
                                    <AvatarFallback className="text-2xl bg-primary/10">
                                        {user?.username ? getInitials(user.username) : <User className="h-10 w-10" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={handleAvatarClick}
                                >
                                    {isUploadingAvatar ? (
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    ) : (
                                        <Camera className="h-6 w-6 text-white" />
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
                            <div>
                                <h3 className="font-semibold text-lg">{user?.username}</h3>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Click avatar to change photo
                                </p>
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
        </div>
    );
}
