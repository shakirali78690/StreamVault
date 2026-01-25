import { useQuery } from "@tanstack/react-query";
import { Badge } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { icons } from "lucide-react";
import { ShieldCheck, Lock } from "lucide-react";
import { useEffect } from "react";

interface AchievementDef {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export default function AchievementsPage() {
    const { user, refetchUser } = useAuth();

    // Ensure user data is up-to-date when visiting this page
    useEffect(() => {
        refetchUser();
    }, [refetchUser]);

    const { data: allAchievements, isLoading } = useQuery<AchievementDef[]>({
        queryKey: ["/api/achievements"],
    });

    const userBadges = user?.badges ? JSON.parse(user.badges) : [];
    const earnedBadgeIds = new Set(userBadges.map((b: Badge) => b.id));

    // Dynamic Icon component
    const LucideIcon = ({ name, className }: { name: string; className?: string }) => {
        const Icon = (icons as any)[name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')] || (icons as any)[name] || ShieldCheck;
        // Fallback for mapped names or direct lucide names
        // Note: Lucide icon names in my definition are kebab-case ("user-plus"), 
        // but lucide-react exports PascalCase ("UserPlus"). 
        // Simple heuristic: converting kebab to Pascal

        const PascalName = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
        const ResolvedIcon = (icons as any)[PascalName] || (icons as any)[name] || ShieldCheck;

        return <ResolvedIcon className={className} />;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-purple-500" />
                        Achievements
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track your progress and earn unique badges!
                    </p>
                </div>

                <div className="bg-card border border-white/10 px-4 py-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Unlocked</span>
                    <div className="text-2xl font-bold text-purple-400">
                        {earnedBadgeIds.size} <span className="text-muted-foreground text-sm font-normal">/ {allAchievements?.length || 0}</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allAchievements?.map((achievement) => {
                        const isUnlocked = earnedBadgeIds.has(achievement.id);
                        const earnedData = userBadges.find((b: Badge) => b.id === achievement.id);

                        return (
                            <Card
                                key={achievement.id}
                                className={`transition-all duration-300 ${isUnlocked
                                    ? "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:border-purple-500/50 shadow-lg shadow-purple-500/5"
                                    : "bg-card/50 opacity-60 grayscale hover:grayscale-0 hover:opacity-80 border-white/5"
                                    }`}
                            >
                                <CardContent className="p-6 flex flex-col items-center text-center h-full justify-center gap-3">
                                    <div className={`p-3 rounded-full ${isUnlocked ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-muted-foreground"}`}>
                                        {isUnlocked && achievement.imageUrl ? (
                                            <img src={achievement.imageUrl} alt={achievement.name} className="w-12 h-12 object-contain" />
                                        ) : isUnlocked ? (
                                            <LucideIcon name={achievement.icon} className="w-8 h-8" />
                                        ) : (
                                            <Lock className="w-6 h-6" />
                                        )}
                                    </div>

                                    <div>
                                        <h3 className={`font-bold ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                                            {achievement.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {achievement.description}
                                        </p>
                                    </div>

                                    {isUnlocked && (
                                        <div className="mt-auto pt-2 text-[10px] text-purple-400/60 uppercase font-semibold tracking-wider">
                                            Unlocked {new Date(earnedData.earnedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
