import { useState } from 'react';
import { Crown, Users, Twitter, Instagram, Youtube, ExternalLink } from 'lucide-react';
import { SiTiktok, SiDiscord } from 'react-icons/si';
import { Link } from 'wouter';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SocialLinks {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    discord?: string;
}

interface FavoriteItem {
    id: string;
    title: string;
    posterUrl: string | null;
    slug?: string;
}

interface Favorites {
    shows?: FavoriteItem[];
    movies?: FavoriteItem[];
    anime?: FavoriteItem[];
}

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        username: string;
        avatarUrl?: string;
        authUserId?: string;
        isHost?: boolean;
        bio?: string;
        socialLinks?: SocialLinks | null;
        favorites?: Favorites | null;
    };
    isFriend?: boolean;
}

// Social link component
function SocialLinkIcon({ platform, value }: { platform: string; value: string }) {
    const getUrl = () => {
        switch (platform) {
            case 'twitter': return `https://twitter.com/${value}`;
            case 'instagram': return `https://instagram.com/${value}`;
            case 'youtube': return value.startsWith('http') ? value : `https://youtube.com/@${value}`;
            case 'tiktok': return `https://tiktok.com/@${value}`;
            case 'discord': return null; // Discord usernames aren't linkable
            default: return null;
        }
    };

    const getIcon = () => {
        switch (platform) {
            case 'twitter': return <Twitter className="h-4 w-4" />;
            case 'instagram': return <Instagram className="h-4 w-4" />;
            case 'youtube': return <Youtube className="h-4 w-4" />;
            case 'tiktok': return <SiTiktok className="h-4 w-4" />;
            case 'discord': return <SiDiscord className="h-4 w-4" />;
            default: return null;
        }
    };

    const getColor = () => {
        switch (platform) {
            case 'twitter': return 'bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20';
            case 'instagram': return 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-pink-500 hover:from-purple-500/20 hover:to-pink-500/20';
            case 'youtube': return 'bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/20';
            case 'tiktok': return 'bg-black/10 text-foreground hover:bg-black/20';
            case 'discord': return 'bg-[#5865F2]/10 text-[#5865F2] hover:bg-[#5865F2]/20';
            default: return 'bg-muted';
        }
    };

    const url = getUrl();

    if (url) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${getColor()}`}
                title={`${platform}: ${value}`}
            >
                {getIcon()}
            </a>
        );
    }

    return (
        <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${getColor()}`}
            title={`${platform}: ${value}`}
        >
            {getIcon()}
        </div>
    );
}

export function UserProfileModal({ isOpen, onClose, user, isFriend }: UserProfileModalProps) {
    const [showFullAvatar, setShowFullAvatar] = useState(false);

    const hasSocialLinks = user.socialLinks && Object.values(user.socialLinks).some(v => v);
    const hasFavorites = user.favorites && (
        (user.favorites.shows?.length || 0) > 0 ||
        (user.favorites.movies?.length || 0) > 0 ||
        (user.favorites.anime?.length || 0) > 0
    );

    return (
        <>
            {/* Profile Modal */}
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">

                    <div className="flex flex-col items-center gap-4 py-4">
                        {/* Clickable Avatar */}
                        <button
                            onClick={() => user.avatarUrl && setShowFullAvatar(true)}
                            className="relative group cursor-pointer"
                            disabled={!user.avatarUrl}
                        >
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-4 ring-primary/20 transition-all group-hover:ring-primary/40">
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-bold text-muted-foreground">
                                        {user.username.slice(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            {user.avatarUrl && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-medium">View</span>
                                </div>
                            )}
                        </button>

                        {/* Username */}
                        <div className="text-center">
                            <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                                {user.isHost && <Crown className="h-4 w-4 text-yellow-500" />}
                                {user.username}
                            </h3>
                            {isFriend && (
                                <p className="text-sm text-green-500 flex items-center justify-center gap-1 mt-1">
                                    <Users className="h-3 w-3" />
                                    Friend
                                </p>
                            )}
                        </div>

                        {/* Bio */}
                        {user.bio ? (
                            <div className="w-full px-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Bio</h4>
                                <p className="text-sm bg-muted/50 rounded-lg px-3 py-2">
                                    {user.bio}
                                </p>
                            </div>
                        ) : null}

                        {/* Social Links */}
                        {hasSocialLinks && (
                            <div className="w-full px-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Connect</h4>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {user.socialLinks?.twitter && (
                                        <SocialLinkIcon platform="twitter" value={user.socialLinks.twitter} />
                                    )}
                                    {user.socialLinks?.instagram && (
                                        <SocialLinkIcon platform="instagram" value={user.socialLinks.instagram} />
                                    )}
                                    {user.socialLinks?.youtube && (
                                        <SocialLinkIcon platform="youtube" value={user.socialLinks.youtube} />
                                    )}
                                    {user.socialLinks?.tiktok && (
                                        <SocialLinkIcon platform="tiktok" value={user.socialLinks.tiktok} />
                                    )}
                                    {user.socialLinks?.discord && (
                                        <SocialLinkIcon platform="discord" value={user.socialLinks.discord} />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Favorites */}
                        {hasFavorites && (
                            <div className="w-full px-4 space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground">Favorites</h4>

                                {/* Favorite Shows */}
                                {user.favorites?.shows && user.favorites.shows.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">TV Shows</p>
                                        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1">
                                            {user.favorites.shows.map((item) => {
                                                const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                                return (
                                                    <Link key={item.id} href={`/show/${slug}`}>
                                                        <a className="flex-shrink-0 block hover:scale-105 transition-transform">
                                                            <img
                                                                src={item.posterUrl || '/placeholder-poster.jpg'}
                                                                alt={item.title}
                                                                className="w-16 h-24 object-cover rounded-lg border-2 border-red-500"
                                                                title={item.title}
                                                            />
                                                        </a>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Favorite Movies */}
                                {user.favorites?.movies && user.favorites.movies.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Movies</p>
                                        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1">
                                            {user.favorites.movies.map((item) => {
                                                const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                                return (
                                                    <Link key={item.id} href={`/movie/${slug}`}>
                                                        <a className="flex-shrink-0 block hover:scale-105 transition-transform">
                                                            <img
                                                                src={item.posterUrl || '/placeholder-poster.jpg'}
                                                                alt={item.title}
                                                                className="w-16 h-24 object-cover rounded-lg border-2 border-red-500"
                                                                title={item.title}
                                                            />
                                                        </a>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Favorite Anime */}
                                {user.favorites?.anime && user.favorites.anime.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Anime</p>
                                        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1">
                                            {user.favorites.anime.map((item) => {
                                                const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                                return (
                                                    <Link key={item.id} href={`/anime/${slug}`}>
                                                        <a className="flex-shrink-0 block hover:scale-105 transition-transform">
                                                            <img
                                                                src={item.posterUrl || '/placeholder-poster.jpg'}
                                                                alt={item.title}
                                                                className="w-16 h-24 object-cover rounded-lg border-2 border-red-500"
                                                                title={item.title}
                                                            />
                                                        </a>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No content message */}
                        {!user.bio && !hasSocialLinks && !hasFavorites && (
                            <p className="text-sm text-muted-foreground italic">No profile info available</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Full Avatar Preview - Click anywhere to close */}
            {showFullAvatar && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
                    onClick={() => setShowFullAvatar(false)}
                >
                    {user.avatarUrl && (
                        <img
                            src={user.avatarUrl}
                            alt={user.username}
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}
        </>
    );
}

// Standalone Avatar Preview component for use in profile page
export function AvatarPreview({ avatarUrl, username }: { avatarUrl?: string | null; username: string }) {
    const [showFullAvatar, setShowFullAvatar] = useState(false);

    return (
        <>
            <button
                onClick={() => avatarUrl && setShowFullAvatar(true)}
                className="relative group cursor-pointer"
                disabled={!avatarUrl}
            >
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-4 ring-primary/20 transition-all group-hover:ring-primary/40">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={username}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-3xl font-bold text-muted-foreground">
                            {username.slice(0, 2).toUpperCase()}
                        </span>
                    )}
                </div>
                {avatarUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-medium">View</span>
                    </div>
                )}
            </button>

            {/* Full Avatar Preview - Click anywhere to close */}
            {showFullAvatar && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
                    onClick={() => setShowFullAvatar(false)}
                >
                    {avatarUrl && (
                        <img
                            src={avatarUrl}
                            alt={username}
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}
        </>
    );
}
