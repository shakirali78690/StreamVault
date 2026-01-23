import { storage } from "./storage";
import { User } from "@shared/schema";

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (user: User, additionalData?: any) => boolean | Promise<boolean>;
}

export const ACHIEVEMENTS: Achievement[] = [
    // --- Progression ---
    { id: "level-2-novice", name: "Novice", description: "Reach Level 2", icon: "user", condition: (user) => (user.level || 1) >= 2 },
    { id: "level-5-apprentice", name: "Apprentice", description: "Reach Level 5", icon: "star", condition: (user) => (user.level || 1) >= 5 },
    { id: "level-10-expert", name: "Expert", description: "Reach Level 10", icon: "shield", condition: (user) => (user.level || 1) >= 10 },
    { id: "level-20-master", name: "Master", description: "Reach Level 20", icon: "crown", condition: (user) => (user.level || 1) >= 20 },
    { id: "level-50-legend", name: "Legend", description: "Reach Level 50", icon: "award", condition: (user) => (user.level || 1) >= 50 },

    // --- XP Milestones ---
    { id: "xp-1k", name: "Getting Started", description: "Earn 1,000 XP", icon: "zap", condition: (user) => (user.xp || 0) >= 1000 },
    { id: "xp-10k", name: "Dedicated Viewer", description: "Earn 10,000 XP", icon: "zap-off", condition: (user) => (user.xp || 0) >= 10000 },
    { id: "xp-50k", name: "Streamaholic", description: "Earn 50,000 XP", icon: "flame", condition: (user) => (user.xp || 0) >= 50000 },
    { id: "xp-100k", name: "Vault Keeper", description: "Earn 100,000 XP", icon: "gem", condition: (user) => (user.xp || 0) >= 100000 },

    // --- Genre Specific ---
    {
        id: "genre-horror-5", name: "Horror Fan", description: "Watch 5 Horror movies", icon: "ghost",
        condition: async (user) => (await countGenre(user.id, "horror", "movie")) >= 5
    },
    {
        id: "genre-comedy-5", name: "Comedy King", description: "Watch 5 Comedy movies", icon: "laugh",
        condition: async (user) => (await countGenre(user.id, "comedy", "movie")) >= 5
    },
    {
        id: "genre-action-10", name: "Adrenaline Junkie", description: "Watch 10 Action movies", icon: "sword",
        condition: async (user) => (await countGenre(user.id, "action", "movie")) >= 10
    },
    {
        id: "genre-romance-5", name: "Hopeless Romantic", description: "Watch 5 Romance movies", icon: "heart",
        condition: async (user) => (await countGenre(user.id, "romance", "movie")) >= 5
    },
    {
        id: "genre-scifi-5", name: "Time Traveler", description: "Watch 5 Sci-Fi movies", icon: "rocket",
        condition: async (user) => (await countGenre(user.id, "sci-fi", "movie")) >= 5
    },
    {
        id: "genre-anime-10", name: "Otaku", description: "Watch 10 Anime series", icon: "japanese-yen", // using yen as a proxy for anime/japan or maybe 'popcorn'
        condition: async (user) => (await countGenre(user.id, "", "anime")) >= 10 // Count any anime
    },

    // --- Activity ---
    {
        id: "binge-watcher-10", name: "Binge Watcher", description: "Watch 10 Episodes", icon: "tv",
        condition: async (user) => (await countContent(user.id, "episode")) >= 10
    },
    {
        id: "marathon-50", name: "Marathon Runner", description: "Watch 50 Episodes", icon: "repeat",
        condition: async (user) => (await countContent(user.id, "episode")) >= 50
    },
    {
        id: "movie-buff-10", name: "Movie Buff", description: "Watch 10 Movies", icon: "film",
        condition: async (user) => (await countContent(user.id, "movie")) >= 10
    },
    {
        id: "cinema-god-50", name: "Cinema God", description: "Watch 50 Movies", icon: "clapperboard",
        condition: async (user) => (await countContent(user.id, "movie")) >= 50
    },

    // --- Social ---
    {
        id: "social-1", name: "Friendly Face", description: "Have 1 Friend", icon: "user-plus",
        condition: async (user) => (await storage.getFriends(user.id)).length >= 1
    },
    {
        id: "social-5", name: "Social Butterfly", description: "Have 5 Friends", icon: "users",
        condition: async (user) => (await storage.getFriends(user.id)).length >= 5
    },
    {
        id: "social-10", name: "Popular", description: "Have 10 Friends", icon: "party-popper",
        condition: async (user) => (await storage.getFriends(user.id)).length >= 10
    },

    // --- Misc ---
    {
        id: "early-bird", name: "Early Bird", description: "Watch something before 8 AM", icon: "sunrise",
        condition: async (user) => {
            const progress = await storage.getViewingProgress(user.id);
            return progress.some(p => {
                const hour = new Date(p.lastWatched).getHours();
                return hour >= 5 && hour < 8;
            });
        }
    },
    {
        id: "night-owl", name: "Night Owl", description: "Watch something after 2 AM", icon: "moon",
        condition: async (user) => {
            const progress = await storage.getViewingProgress(user.id);
            return progress.some(p => {
                const hour = new Date(p.lastWatched).getHours();
                return hour >= 2 && hour < 5;
            });
        }
    }
];

// Helper to count content by type/genre
async function countGenre(userId: string, genre: string, type: "movie" | "show" | "anime"): Promise<number> {
    const progress = await storage.getViewingProgress(userId);
    let count = 0;
    for (const entry of progress) {
        if ((entry.progress / entry.duration) > 0.9) {
            let matches = false;

            if (type === "movie" && entry.movieId) {
                const m = await storage.getMovieById(entry.movieId);
                if (m && (!genre || m.genres.toLowerCase().includes(genre))) matches = true;
            } else if (type === "anime" && entry.animeId) {
                const a = await storage.getAnimeById(entry.animeId);
                if (a && (!genre || a.genres.toLowerCase().includes(genre))) matches = true;
            }

            if (matches) count++;
        }
    }
    return count;
}

async function countContent(userId: string, type: "episode" | "movie"): Promise<number> {
    const progress = await storage.getViewingProgress(userId);
    let count = 0;
    for (const entry of progress) {
        if ((entry.progress / entry.duration) > 0.9) {
            if (type === "episode" && (entry.episodeId || entry.showId)) count++;
            else if (type === "movie" && entry.movieId) count++;
        }
    }
    return count;
}

export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
    const user = await storage.getUserById(userId);
    if (!user) return [];

    const earnedBadges: string[] = [];
    const existingBadges = user.badges ? JSON.parse(user.badges) : [];
    const existingBadgeIds = new Set(existingBadges.map((b: any) => b.id));

    for (const achievement of ACHIEVEMENTS) {
        if (existingBadgeIds.has(achievement.id)) continue;

        try {
            const metCondition = await achievement.condition(user);
            if (metCondition) {
                await storage.addBadge(userId, {
                    id: achievement.id,
                    name: achievement.name,
                    description: achievement.description,
                    icon: achievement.icon,
                    earnedAt: new Date().toISOString()
                });
                earnedBadges.push(achievement.name);
            }
        } catch (err) {
            console.error(`Error checking achievement ${achievement.id}:`, err);
        }
    }

    return earnedBadges;
}
