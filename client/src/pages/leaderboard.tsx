
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AvatarPreview } from "@/components/user-profile-modal";
import { Badge } from "@shared/schema";
import { Crown, Trophy, Medal, Star, icons, Flame, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
    id: string;
    username: string;
    avatarUrl?: string;
    xp: number;
    level: number;
    badges: Badge[];
}

export default function Leaderboard() {
    const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

    const { data: users, isLoading } = useQuery<LeaderboardUser[]>({
        queryKey: ["/api/leaderboard", timeFilter],
        queryFn: async () => {
            const res = await fetch(`/api/leaderboard?period=${timeFilter}`);
            if (!res.ok) throw new Error("Failed to fetch leaderboard");
            return res.json();
        }
    });

    // Referral leaderboard
    const { data: referralLeaders } = useQuery<{ userId: string; username: string; referralCount: number }[]>({
        queryKey: ["/api/referral-leaderboard"],
    });

    // Get users with streaks (from main leaderboard, sorted by streak)
    const streakLeaders = users
        ?.filter((u: any) => u.currentStreak && u.currentStreak > 0)
        ?.sort((a: any, b: any) => (b.currentStreak || 0) - (a.currentStreak || 0))
        ?.slice(0, 10) || [];

    const getBadgeIcon = (badge: Badge) => {
        const iconName = badge.icon || 'Star';
        const PascalName = iconName.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
        const IconComponent = (icons as any)[PascalName] || (icons as any)[iconName] || Star;
        return <IconComponent className="w-3 h-3" />;
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-4 max-w-4xl mx-auto">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const topUsers = users || [];
    // Podium logic: 2nd, 1st, 3rd
    const podiumUsers = [topUsers[1], topUsers[0], topUsers[2]];
    const listUsers = topUsers.slice(3);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                    <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
                        Leaderboard
                    </span>
                </h1>
                <p className="text-muted-foreground">The top viewers on StreamVault</p>
            </motion.div>

            {/* Time Filter Tabs */}
            <div className="flex justify-center mb-8">
                <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as any)}>
                    <TabsList className="grid grid-cols-3 w-80">
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Podium Section */}
            <div className="flex justify-center items-end gap-4 md:gap-12 mb-16 min-h-[350px]">
                {podiumUsers.map((user, index) => {
                    if (!user) return null;

                    // index 0 -> Rank 2 (Silver)
                    // index 1 -> Rank 1 (Gold)
                    // index 2 -> Rank 3 (Bronze)
                    const rank = index === 0 ? 2 : index === 1 ? 1 : 3;
                    const isFirst = rank === 1;

                    return (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            className={cn(
                                "flex flex-col items-center",
                                isFirst ? "mb-16 z-10 scale-110" : ""
                            )}
                        >
                            {/* Avatar Container */}
                            <div className="relative mb-4">
                                {isFirst && (
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-28 h-28 z-20">
                                        <img src="/crown-v2.png" alt="Crown" className="w-full h-full object-contain drop-shadow-md pb-2" />
                                    </div>
                                )}

                                <div className={cn(
                                    "rounded-full p-1.5 transition-all duration-300 hover:scale-105 cursor-pointer",
                                    rank === 1 ? "bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_40px_rgba(234,179,8,0.3)]" :
                                        rank === 2 ? "bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 shadow-[0_0_30px_rgba(148,163,184,0.2)]" :
                                            "bg-gradient-to-b from-orange-400 via-orange-600 to-amber-800 shadow-[0_0_30px_rgba(234,88,12,0.2)]"
                                )}>
                                    <AvatarPreview
                                        avatarUrl={user.avatarUrl}
                                        username={user.username}
                                        className={cn(
                                            "border-[4px] border-[#0f0f0f]", // Dark border to separate image from ring
                                            rank === 1 ? "w-32 h-32" : "w-24 h-24"
                                        )}
                                    />
                                </div>

                                {/* Rank Badge Bubble */}
                                <div className={cn(
                                    "absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-[3px] border-[#0f0f0f]",
                                    rank === 1 ? "bg-yellow-500" :
                                        rank === 2 ? "bg-slate-500" :
                                            "bg-orange-600"
                                )}>
                                    {rank}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="text-center space-y-1">
                                <h3 className={cn(
                                    "font-bold truncate max-w-[120px] md:max-w-[150px]",
                                    rank === 1 ? "text-xl text-yellow-500" : "text-lg text-foreground"
                                )}>
                                    {user.username}
                                </h3>
                                <div className="text-sm font-bold text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                                    {(user.xp || 0).toLocaleString()} XP
                                </div>
                                <div className={cn(
                                    "text-xs font-medium uppercase tracking-wider",
                                    rank === 1 ? "text-yellow-500/70" : "text-muted-foreground/70"
                                )}>
                                    Lvl {user.level}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* List Section */}
            <div className="bg-card/20 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                <div className="space-y-4">
                    {listUsers.length > 0 && (
                        <div className="flex items-center justify-between px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-50">
                            <span className="w-12 text-center">#</span>
                            <span className="flex-1 ml-4">User</span>
                            <span className="hidden md:block w-32 text-left">Level</span>
                            <span className="w-24 text-right">Points</span>
                        </div>
                    )}

                    {listUsers.map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + (index * 0.05) }}
                        >
                            <div className="group flex items-center p-3 rounded-xl bg-card/40 border border-transparent hover:bg-card/80 hover:border-white/10 transition-all duration-200 cursor-default">
                                {/* Rank */}
                                <span className={cn(
                                    "w-12 text-center font-bold",
                                    index < 3 ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {index + 4}
                                </span>

                                {/* Avatar */}
                                <div className="ml-4 mr-4">
                                    <AvatarPreview
                                        avatarUrl={user.avatarUrl}
                                        username={user.username}
                                        className="w-10 h-10 group-hover:scale-105 transition-transform"
                                    />
                                </div>

                                {/* Names & Badges */}
                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                    <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                        {user.username}
                                    </span>
                                    {user.badges && user.badges.length > 0 && (
                                        <div className="hidden sm:flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                            {user.badges.slice(0, 3).map(badge => (
                                                <div key={badge.id} className="text-muted-foreground" title={badge.name}>
                                                    {getBadgeIcon(badge)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Level (Desktop) */}
                                <div className="hidden md:block w-32">
                                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                                        LVL {user.level}
                                    </span>
                                </div>

                                {/* XP */}
                                <div className="text-sm font-mono font-bold text-right w-24 text-muted-foreground group-hover:text-foreground transition-colors">
                                    {(user.xp || 0).toLocaleString()} <span className="text-[10px] font-normal opacity-50">XP</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Additional Leaderboards Section */}
            <div className="grid md:grid-cols-2 gap-6 mt-12">
                {/* Referral Leaderboard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Top Referrers</h2>
                            <p className="text-xs text-muted-foreground">Most successful inviters</p>
                        </div>
                    </div>

                    {referralLeaders && referralLeaders.length > 0 ? (
                        <div className="space-y-3">
                            {referralLeaders.slice(0, 10).map((leader, index) => (
                                <div
                                    key={leader.userId}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-white/5"
                                >
                                    <span className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                        index === 0 ? "bg-yellow-500 text-black" :
                                            index === 1 ? "bg-slate-400 text-black" :
                                                index === 2 ? "bg-orange-500 text-black" :
                                                    "bg-muted text-muted-foreground"
                                    )}>
                                        {index + 1}
                                    </span>
                                    <span className="flex-1 font-medium truncate">{leader.username}</span>
                                    <div className="flex items-center gap-1 text-purple-400">
                                        <UserPlus className="w-4 h-4" />
                                        <span className="font-bold">{leader.referralCount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No referrals yet. Be the first!</p>
                    )}
                </motion.div>

                {/* Streak Leaderboard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-6 border border-orange-500/20"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Streak Champions</h2>
                            <p className="text-xs text-muted-foreground">Longest watch streaks</p>
                        </div>
                    </div>

                    {streakLeaders.length > 0 ? (
                        <div className="space-y-3">
                            {streakLeaders.map((user: any, index: number) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-white/5"
                                >
                                    <span className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                        index === 0 ? "bg-yellow-500 text-black" :
                                            index === 1 ? "bg-slate-400 text-black" :
                                                index === 2 ? "bg-orange-500 text-black" :
                                                    "bg-muted text-muted-foreground"
                                    )}>
                                        {index + 1}
                                    </span>
                                    <AvatarPreview
                                        avatarUrl={user.avatarUrl}
                                        username={user.username}
                                        className="w-8 h-8"
                                    />
                                    <span className="flex-1 font-medium truncate">{user.username}</span>
                                    <div className="flex items-center gap-1 text-orange-400">
                                        <Flame className="w-4 h-4" />
                                        <span className="font-bold">{user.currentStreak}</span>
                                        <span className="text-xs text-muted-foreground">days</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Start watching to build your streak!</p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

const Icons = {
    Zap: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    )
};
