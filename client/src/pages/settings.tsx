import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Settings, Bot, Bell, Eye, Volume2, Moon, Palette, Shield, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme-provider';

// Settings stored in localStorage
const SETTINGS_KEY = 'streamvault_settings';

interface AppSettings {
    chatbotEnabled: boolean;
    soundEnabled: boolean;
    autoplayTrailers: boolean;
    showAdultContent: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    friendActivityVisible: boolean;
    defaultVideoQuality: 'auto' | '1080p' | '720p' | '480p';
    subtitlesEnabled: boolean;
}

const defaultSettings: AppSettings = {
    chatbotEnabled: true,
    soundEnabled: true,
    autoplayTrailers: true,
    showAdultContent: false,
    pushNotifications: true,
    emailNotifications: true,
    friendActivityVisible: true,
    defaultVideoQuality: 'auto',
    subtitlesEnabled: true,
};

export default function SettingsPage() {
    const [, navigate] = useLocation();
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();

    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings({ ...defaultSettings, ...parsed });
            } catch (e) {
                console.error('Failed to parse settings:', e);
            }
        }
    }, []);

    // Redirect if not logged in
    if (!authLoading && !isAuthenticated) {
        navigate('/login');
        return null;
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));

        // Dispatch event for other components to react
        window.dispatchEvent(new CustomEvent('settings-changed', { detail: { key, value } }));
    };

    const handleSaveSettings = () => {
        setIsSaving(true);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        setTimeout(() => {
            setIsSaving(false);
            toast({
                title: 'Settings saved',
                description: 'Your preferences have been updated.',
            });
        }, 500);
    };

    const handleResetSettings = () => {
        setSettings(defaultSettings);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
        toast({
            title: 'Settings reset',
            description: 'All settings have been restored to defaults.',
        });
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Settings className="h-8 w-8" />
                    Settings
                </h1>
                <p className="text-muted-foreground mt-2">Customize your StreamVault experience</p>
            </div>

            <div className="space-y-6">
                {/* Appearance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Appearance
                        </CardTitle>
                        <CardDescription>Customize the look and feel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="theme">Theme</Label>
                                <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                            </div>
                            <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Features */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Features
                        </CardTitle>
                        <CardDescription>Enable or disable app features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="chatbot">AI Chatbot</Label>
                                <p className="text-sm text-muted-foreground">Show the AI assistant chat widget</p>
                            </div>
                            <Switch
                                id="chatbot"
                                checked={settings.chatbotEnabled}
                                onCheckedChange={(checked) => updateSetting('chatbotEnabled', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="autoplay">Autoplay Trailers</Label>
                                <p className="text-sm text-muted-foreground">Automatically play trailers on content pages</p>
                            </div>
                            <Switch
                                id="autoplay"
                                checked={settings.autoplayTrailers}
                                onCheckedChange={(checked) => updateSetting('autoplayTrailers', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="subtitles">Subtitles by Default</Label>
                                <p className="text-sm text-muted-foreground">Enable subtitles automatically when available</p>
                            </div>
                            <Switch
                                id="subtitles"
                                checked={settings.subtitlesEnabled}
                                onCheckedChange={(checked) => updateSetting('subtitlesEnabled', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Playback */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Volume2 className="h-5 w-5" />
                            Playback
                        </CardTitle>
                        <CardDescription>Video and audio preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="quality">Default Video Quality</Label>
                                <p className="text-sm text-muted-foreground">Preferred streaming quality</p>
                            </div>
                            <Select
                                value={settings.defaultVideoQuality}
                                onValueChange={(value: 'auto' | '1080p' | '720p' | '480p') => updateSetting('defaultVideoQuality', value)}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto</SelectItem>
                                    <SelectItem value="1080p">1080p</SelectItem>
                                    <SelectItem value="720p">720p</SelectItem>
                                    <SelectItem value="480p">480p</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="sound">Sound Effects</Label>
                                <p className="text-sm text-muted-foreground">Play notification and UI sounds</p>
                            </div>
                            <Switch
                                id="sound"
                                checked={settings.soundEnabled}
                                onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                        <CardDescription>Manage your notification preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="push">Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">Get browser notifications for updates</p>
                            </div>
                            <Switch
                                id="push"
                                checked={settings.pushNotifications}
                                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="email">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive email updates about new content</p>
                            </div>
                            <Switch
                                id="email"
                                checked={settings.emailNotifications}
                                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Privacy
                        </CardTitle>
                        <CardDescription>Control your privacy settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="activity">Show Activity to Friends</Label>
                                <p className="text-sm text-muted-foreground">Let friends see what you're watching</p>
                            </div>
                            <Switch
                                id="activity"
                                checked={settings.friendActivityVisible}
                                onCheckedChange={(checked) => updateSetting('friendActivityVisible', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="adult">Adult Content</Label>
                                <p className="text-sm text-muted-foreground">Show 18+ content in search results</p>
                            </div>
                            <Switch
                                id="adult"
                                checked={settings.showAdultContent}
                                onCheckedChange={(checked) => updateSetting('showAdultContent', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleSaveSettings} disabled={isSaving} className="flex-1">
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Settings'
                        )}
                    </Button>
                    <Button variant="outline" onClick={handleResetSettings}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Reset to Defaults
                    </Button>
                </div>
            </div>
        </div>
    );
}
