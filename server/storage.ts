import type { Show, Episode, Movie, InsertShow, InsertEpisode, InsertMovie, WatchlistItem, ViewingProgress, Category } from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

interface WatchlistEntry extends WatchlistItem {
  id: string;
}

interface ProgressEntry extends ViewingProgress {
  id: string;
}

export interface ContentRequest {
  id: string;
  contentType: string;
  title: string;
  year?: string;
  genre?: string;
  description?: string;
  reason?: string;
  email?: string;
  requestCount: number;
  createdAt: string;
}

export interface IssueReport {
  id: string;
  issueType: string;
  title: string;
  description: string;
  url?: string;
  email?: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface IStorage {
  // Shows
  getAllShows(): Promise<Show[]>;
  getShowById(id: string): Promise<Show | undefined>;
  getShowBySlug(slug: string): Promise<Show | undefined>;
  createShow(show: InsertShow): Promise<Show>;
  updateShow(id: string, updates: Partial<Show>): Promise<Show>;
  deleteShow(id: string): Promise<void>;
  searchShows(query: string): Promise<Show[]>;

  // Episodes
  getEpisodesByShowId(showId: string): Promise<Episode[]>;
  getEpisodeById(id: string): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: string, updates: Partial<Episode>): Promise<Episode>;
  deleteEpisode(id: string): Promise<void>;

  // Movies
  getAllMovies(): Promise<Movie[]>;
  getMovieById(id: string): Promise<Movie | undefined>;
  getMovieBySlug(slug: string): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: string, updates: Partial<Movie>): Promise<Movie>;
  deleteMovie(id: string): Promise<void>;
  searchMovies(query: string): Promise<Movie[]>;

  // Categories
  getAllCategories(): Promise<Category[]>;

  // Watchlist (simulated per-session storage)
  getWatchlist(sessionId: string): Promise<WatchlistEntry[]>;
  addToWatchlist(sessionId: string, item: WatchlistItem): Promise<WatchlistEntry>;
  removeFromWatchlist(sessionId: string, id: string, isMovie?: boolean): Promise<void>;

  // Viewing Progress (simulated per-session storage)
  getViewingProgress(sessionId: string): Promise<ProgressEntry[]>;
  updateViewingProgress(sessionId: string, progress: ViewingProgress): Promise<ProgressEntry>;

  // Content Requests
  getAllContentRequests(): Promise<ContentRequest[]>;
  getTopContentRequests(limit: number): Promise<ContentRequest[]>;
  createContentRequest(request: Omit<ContentRequest, 'id' | 'requestCount' | 'createdAt'>): Promise<ContentRequest>;

  // Issue Reports
  getAllIssueReports(): Promise<IssueReport[]>;
  createIssueReport(report: Omit<IssueReport, 'id' | 'status' | 'createdAt'>): Promise<IssueReport>;
}

export class MemStorage implements IStorage {
  private shows: Map<string, Show>;
  private episodes: Map<string, Episode>;
  private movies: Map<string, Movie>;
  private watchlists: Map<string, Map<string, WatchlistEntry>>;
  private viewingProgress: Map<string, Map<string, ProgressEntry>>;
  private categories: Category[];
  private contentRequests: Map<string, ContentRequest>;
  private issueReports: Map<string, IssueReport>;
  private dataFile: string;

  constructor() {
    this.dataFile = join(process.cwd(), "data", "streamvault-data.json");
    this.shows = new Map();
    this.episodes = new Map();
    this.movies = new Map();
    this.watchlists = new Map();
    this.viewingProgress = new Map();
    this.contentRequests = new Map();
    this.issueReports = new Map();
    this.categories = [
      { id: "action", name: "Action & Thriller", slug: "action" },
      { id: "drama", name: "Drama & Romance", slug: "drama" },
      { id: "comedy", name: "Comedy", slug: "comedy" },
      { id: "horror", name: "Horror & Mystery", slug: "horror" },
      { id: "romance", name: "Romance", slug: "romance" },
      { id: "thriller", name: "Thriller", slug: "thriller" },
      { id: "sci-fi", name: "Sci-Fi & Fantasy", slug: "sci-fi" },
      { id: "crime", name: "Crime & Mystery", slug: "crime" },
      { id: "adventure", name: "Adventure", slug: "adventure" },
    ];
    this.loadData();
  }

  // Load data from JSON file or seed if file doesn't exist
  private loadData() {
    try {
      if (existsSync(this.dataFile)) {
        console.log("📂 Loading data from file...");
        const data = JSON.parse(readFileSync(this.dataFile, "utf-8"));
        
        // Restore shows
        if (data.shows) {
          data.shows.forEach((show: Show) => this.shows.set(show.id, show));
          console.log(`✅ Loaded ${data.shows.length} shows`);
        }
        
        // Restore episodes
        if (data.episodes) {
          data.episodes.forEach((episode: Episode) => this.episodes.set(episode.id, episode));
          console.log(`✅ Loaded ${data.episodes.length} episodes`);
        }
        
        // Restore movies
        if (data.movies) {
          data.movies.forEach((movie: Movie) => this.movies.set(movie.id, movie));
          console.log(`✅ Loaded ${data.movies.length} movies`);
        }
      } else {
        console.log("📦 No data file found, seeding initial data...");
        this.seedData();
        this.saveData();
      }
    } catch (error) {
      console.error("❌ Error loading data, using seed data:", error);
      this.seedData();
      this.saveData();
    }
  }

  // Save data to JSON file
  private saveData() {
    try {
      const data = {
        shows: Array.from(this.shows.values()),
        episodes: Array.from(this.episodes.values()),
        movies: Array.from(this.movies.values()),
        lastUpdated: new Date().toISOString(),
      };

      // Create data directory if it doesn't exist
      const dataDir = join(process.cwd(), "data");
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      writeFileSync(this.dataFile, JSON.stringify(data, null, 2), "utf-8");
      console.log("💾 Data saved to file");
    } catch (error) {
      console.error("❌ Error saving data:", error);
    }
  }

  // Shows methods
  async getAllShows(): Promise<Show[]> {
    return Array.from(this.shows.values());
  }

  async getShowById(id: string): Promise<Show | undefined> {
    return this.shows.get(id);
  }

  async getShowBySlug(slug: string): Promise<Show | undefined> {
    return Array.from(this.shows.values()).find((show) => show.slug === slug);
  }

  async createShow(insertShow: InsertShow): Promise<Show> {
    const id = randomUUID();
    const show: Show = { 
      ...insertShow, 
      id,
      imdbRating: insertShow.imdbRating || null,
      category: insertShow.category || null,
      cast: insertShow.cast || null,
      creators: insertShow.creators || null,
      featured: insertShow.featured || false,
      trending: insertShow.trending || false
    };
    this.shows.set(id, show);
    this.saveData(); // Persist to file
    return show;
  }

  async updateShow(id: string, updates: Partial<Show>): Promise<Show> {
    const existingShow = this.shows.get(id);
    if (!existingShow) {
      throw new Error("Show not found");
    }
    
    // Merge updates with existing show, ensuring all required fields are present
    const updatedShow: Show = {
      id: existingShow.id, // Never change ID
      title: updates.title ?? existingShow.title,
      slug: updates.slug ?? existingShow.slug,
      description: updates.description ?? existingShow.description,
      posterUrl: updates.posterUrl ?? existingShow.posterUrl,
      backdropUrl: updates.backdropUrl ?? existingShow.backdropUrl,
      year: updates.year ?? existingShow.year,
      rating: updates.rating ?? existingShow.rating,
      imdbRating: updates.imdbRating !== undefined ? updates.imdbRating : existingShow.imdbRating,
      genres: updates.genres ?? existingShow.genres,
      language: updates.language ?? existingShow.language,
      totalSeasons: updates.totalSeasons ?? existingShow.totalSeasons,
      cast: updates.cast !== undefined ? updates.cast : existingShow.cast,
      creators: updates.creators !== undefined ? updates.creators : existingShow.creators,
      featured: updates.featured !== undefined ? updates.featured : existingShow.featured,
      trending: updates.trending !== undefined ? updates.trending : existingShow.trending,
      category: updates.category !== undefined ? updates.category : existingShow.category,
    };
    
    this.shows.set(id, updatedShow);
    this.saveData(); // Persist to file
    return updatedShow;
  }

  async deleteShow(id: string): Promise<void> {
    this.shows.delete(id);
    // Also delete all episodes for this show
    const episodes = await this.getEpisodesByShowId(id);
    episodes.forEach(ep => this.episodes.delete(ep.id));
    this.saveData(); // Persist to file
  }

  async searchShows(query: string): Promise<Show[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.shows.values()).filter(
      (show) =>
        show.title.toLowerCase().includes(lowerQuery) ||
        show.description.toLowerCase().includes(lowerQuery) ||
        show.genres.some((g) => g.toLowerCase().includes(lowerQuery)) ||
        show.cast?.some((c) => c.toLowerCase().includes(lowerQuery)) ||
        false
    );
  }

  // Episodes methods
  async getEpisodesByShowId(showId: string): Promise<Episode[]> {
    return Array.from(this.episodes.values()).filter(
      (episode) => episode.showId === showId
    );
  }

  async getEpisodeById(id: string): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const id = randomUUID();
    const episode: Episode = { 
      ...insertEpisode, 
      id,
      airDate: insertEpisode.airDate || null
    };
    this.episodes.set(id, episode);
    this.saveData(); // Persist to file
    return episode;
  }

  async updateEpisode(id: string, updates: Partial<Episode>): Promise<Episode> {
    const existingEpisode = this.episodes.get(id);
    if (!existingEpisode) {
      throw new Error(`Episode with id ${id} not found`);
    }

    const updatedEpisode: Episode = {
      ...existingEpisode,
      ...updates,
      id: existingEpisode.id, // Never change ID
      showId: existingEpisode.showId, // Never change showId
    };

    this.episodes.set(id, updatedEpisode);
    this.saveData(); // Persist to file
    return updatedEpisode;
  }

  async deleteEpisode(id: string): Promise<void> {
    this.episodes.delete(id);
    this.saveData(); // Persist to file
  }

  // Movie methods
  async getAllMovies(): Promise<Movie[]> {
    return Array.from(this.movies.values());
  }

  async getMovieById(id: string): Promise<Movie | undefined> {
    return this.movies.get(id);
  }

  async getMovieBySlug(slug: string): Promise<Movie | undefined> {
    return Array.from(this.movies.values()).find((movie) => movie.slug === slug);
  }

  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const id = randomUUID();
    const movie: Movie = { 
      id,
      title: insertMovie.title,
      slug: insertMovie.slug,
      description: insertMovie.description,
      posterUrl: insertMovie.posterUrl,
      backdropUrl: insertMovie.backdropUrl,
      year: insertMovie.year,
      rating: insertMovie.rating,
      imdbRating: insertMovie.imdbRating || null,
      genres: insertMovie.genres,
      language: insertMovie.language,
      duration: insertMovie.duration,
      cast: insertMovie.cast || null,
      directors: insertMovie.directors || null,
      googleDriveUrl: insertMovie.googleDriveUrl,
      featured: insertMovie.featured ?? false,
      trending: insertMovie.trending ?? false,
      category: insertMovie.category || null,
    };
    this.movies.set(id, movie);
    this.saveData(); // Persist to file
    return movie;
  }

  async updateMovie(id: string, updates: Partial<Movie>): Promise<Movie> {
    const movie = this.movies.get(id);
    if (!movie) {
      throw new Error(`Movie with id ${id} not found`);
    }
    const updatedMovie = { ...movie, ...updates, id };
    this.movies.set(id, updatedMovie);
    this.saveData(); // Persist to file
    return updatedMovie;
  }

  async deleteMovie(id: string): Promise<void> {
    this.movies.delete(id);
    this.saveData(); // Persist to file
  }

  async searchMovies(query: string): Promise<Movie[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.movies.values()).filter(
      (movie) =>
        movie.title.toLowerCase().includes(lowerQuery) ||
        movie.description.toLowerCase().includes(lowerQuery) ||
        movie.genres?.toLowerCase().includes(lowerQuery)
    );
  }

  // Categories methods
  async getAllCategories(): Promise<Category[]> {
    return this.categories;
  }

  // Watchlist methods
  async getWatchlist(sessionId: string): Promise<WatchlistEntry[]> {
    const userWatchlist = this.watchlists.get(sessionId);
    return userWatchlist ? Array.from(userWatchlist.values()) : [];
  }

  async addToWatchlist(sessionId: string, item: WatchlistItem): Promise<WatchlistEntry> {
    if (!this.watchlists.has(sessionId)) {
      this.watchlists.set(sessionId, new Map());
    }

    const userWatchlist = this.watchlists.get(sessionId)!;
    const id = randomUUID();
    const entry: WatchlistEntry = { ...item, id };
    const key = item.showId || item.movieId || id;
    userWatchlist.set(key, entry);

    return entry;
  }

  async removeFromWatchlist(sessionId: string, id: string, isMovie?: boolean): Promise<void> {
    const userWatchlist = this.watchlists.get(sessionId);
    if (userWatchlist) {
      userWatchlist.delete(id);
    }
  }

  // Viewing Progress methods
  async getViewingProgress(sessionId: string): Promise<ProgressEntry[]> {
    const userProgress = this.viewingProgress.get(sessionId);
    return userProgress ? Array.from(userProgress.values()) : [];
  }

  async updateViewingProgress(sessionId: string, progress: ViewingProgress): Promise<ProgressEntry> {
    if (!this.viewingProgress.has(sessionId)) {
      this.viewingProgress.set(sessionId, new Map());
    }

    const userProgress = this.viewingProgress.get(sessionId)!;
    const id = randomUUID();
    const entry: ProgressEntry = { ...progress, id };
    userProgress.set(progress.showId, entry);

    return entry;
  }

  // Seed sample data
  private seedData() {
    // Sample shows with Netflix-quality data
    const shows: InsertShow[] = [
      {
        title: "Stranger Things",
        slug: "stranger-things",
        description:
          "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
        posterUrl: "https://images.unsplash.com/photo-1574267432644-f65e2d32b5c1?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1574267432644-f65e2d32b5c1?w=1920&h=800&fit=crop",
        year: 2016,
        rating: "TV-14",
        imdbRating: "8.7",
        genres: ["Sci-Fi", "Horror", "Drama"],
        language: "English",
        totalSeasons: 4,
        cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"],
        creators: ["The Duffer Brothers"],
        featured: true,
        trending: true,
        category: "horror",
      },
      {
        title: "Breaking Bad",
        slug: "breaking-bad",
        description:
          "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
        posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=800&fit=crop",
        year: 2008,
        rating: "TV-MA",
        imdbRating: "9.5",
        genres: ["Crime", "Drama", "Thriller"],
        language: "English",
        totalSeasons: 5,
        cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"],
        creators: ["Vince Gilligan"],
        featured: true,
        trending: true,
        category: "drama",
      },
      {
        title: "The Crown",
        slug: "the-crown",
        description:
          "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the 20th century.",
        posterUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&h=800&fit=crop",
        year: 2016,
        rating: "TV-MA",
        imdbRating: "8.6",
        genres: ["Drama", "History"],
        language: "English",
        totalSeasons: 6,
        cast: ["Claire Foy", "Olivia Colman", "Imelda Staunton"],
        creators: ["Peter Morgan"],
        featured: true,
        trending: false,
        category: "drama",
      },
      {
        title: "Money Heist",
        slug: "money-heist",
        description:
          "An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history - stealing 2.4 billion euros from the Royal Mint of Spain.",
        posterUrl: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=1920&h=800&fit=crop",
        year: 2017,
        rating: "TV-MA",
        imdbRating: "8.2",
        genres: ["Action", "Crime", "Thriller"],
        language: "Spanish",
        totalSeasons: 5,
        cast: ["Álvaro Morte", "Itziar Ituño", "Pedro Alonso"],
        creators: ["Álex Pina"],
        featured: true,
        trending: true,
        category: "action",
      },
      {
        title: "The Office",
        slug: "the-office",
        description:
          "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.",
        posterUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1920&h=800&fit=crop",
        year: 2005,
        rating: "TV-14",
        imdbRating: "9.0",
        genres: ["Comedy"],
        language: "English",
        totalSeasons: 9,
        cast: ["Steve Carell", "John Krasinski", "Jenna Fischer"],
        creators: ["Greg Daniels"],
        featured: true,
        trending: true,
        category: "comedy",
      },
      {
        title: "Dark",
        slug: "dark",
        description:
          "A family saga with a supernatural twist, set in a German town, where the disappearance of two young children exposes the relationships among four families.",
        posterUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1920&h=800&fit=crop",
        year: 2017,
        rating: "TV-MA",
        imdbRating: "8.8",
        genres: ["Sci-Fi", "Thriller", "Mystery"],
        language: "German",
        totalSeasons: 3,
        cast: ["Louis Hofmann", "Karoline Eichhorn", "Lisa Vicari"],
        creators: ["Baran bo Odar", "Jantje Friese"],
        featured: false,
        trending: true,
        category: "horror",
      },
      {
        title: "Peaky Blinders",
        slug: "peaky-blinders",
        description:
          "A gangster family epic set in 1900s England, centering on a gang who sew razor blades in the peaks of their caps, and their fierce boss Tommy Shelby.",
        posterUrl: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?w=1920&h=800&fit=crop",
        year: 2013,
        rating: "TV-MA",
        imdbRating: "8.8",
        genres: ["Crime", "Drama"],
        language: "English",
        totalSeasons: 6,
        cast: ["Cillian Murphy", "Paul Anderson", "Sophie Rundle"],
        creators: ["Steven Knight"],
        featured: false,
        trending: true,
        category: "drama",
      },
      {
        title: "Narcos",
        slug: "narcos",
        description:
          "A chronicled look at the criminal exploits of Colombian drug lord Pablo Escobar, as well as the many other drug kingpins who plagued the country through the years.",
        posterUrl: "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=1920&h=800&fit=crop",
        year: 2015,
        rating: "TV-MA",
        imdbRating: "8.8",
        genres: ["Crime", "Drama", "Thriller"],
        language: "English",
        totalSeasons: 3,
        cast: ["Wagner Moura", "Boyd Holbrook", "Pedro Pascal"],
        creators: ["Chris Brancato", "Carlo Bernard", "Doug Miro"],
        featured: false,
        trending: false,
        category: "action",
      },
      {
        title: "The Witcher",
        slug: "the-witcher",
        description:
          "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.",
        posterUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=800&fit=crop",
        year: 2019,
        rating: "TV-MA",
        imdbRating: "8.0",
        genres: ["Action", "Adventure", "Fantasy"],
        language: "English",
        totalSeasons: 3,
        cast: ["Henry Cavill", "Anya Chalotra", "Freya Allan"],
        creators: ["Lauren Schmidt Hissrich"],
        featured: false,
        trending: true,
        category: "action",
      },
      {
        title: "Friends",
        slug: "friends",
        description:
          "Follows the personal and professional lives of six twenty to thirty-something-year-old friends living in Manhattan.",
        posterUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=900&fit=crop",
        backdropUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1920&h=800&fit=crop",
        year: 1994,
        rating: "TV-14",
        imdbRating: "8.9",
        genres: ["Comedy", "Romance"],
        language: "English",
        totalSeasons: 10,
        cast: ["Jennifer Aniston", "Courteney Cox", "Lisa Kudrow"],
        creators: ["David Crane", "Marta Kauffman"],
        featured: false,
        trending: false,
        category: "comedy",
      },
    ];

    // Create shows
    shows.forEach((show) => {
      const id = randomUUID();
      this.shows.set(id, { 
        ...show, 
        id,
        imdbRating: show.imdbRating || null,
        category: show.category || null,
        cast: show.cast || null,
        creators: show.creators || null,
        featured: show.featured || false,
        trending: show.trending || false
      });
    });

    // Create sample episodes for each show
    Array.from(this.shows.values()).forEach((show) => {
      for (let season = 1; season <= Math.min(show.totalSeasons, 2); season++) {
        const episodeCount = season === 1 ? 8 : 6;
        for (let ep = 1; ep <= episodeCount; ep++) {
          const episode: InsertEpisode = {
            showId: show.id,
            season,
            episodeNumber: ep,
            title: `Episode ${ep}`,
            description: `In this exciting episode of ${show.title}, the story continues to unfold with unexpected twists and turns that will keep you on the edge of your seat.`,
            thumbnailUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=1280&h=720&fit=crop`,
            duration: 42 + Math.floor(Math.random() * 18),
            googleDriveUrl: `https://drive.google.com/file/d/1zcFHiGEOwgq2-j6hMqpsE0ov7qcIUqCd/preview`,
            airDate: `${show.year}-${String(season).padStart(2, "0")}-${String(ep * 7).padStart(2, "0")}`,
          };

          const id = randomUUID();
          this.episodes.set(id, { 
            ...episode, 
            id,
            airDate: episode.airDate || null
          });
        }
      }
    });
  }

  // Content Requests
  async getAllContentRequests(): Promise<ContentRequest[]> {
    return Array.from(this.contentRequests.values());
  }

  async getTopContentRequests(limit: number): Promise<ContentRequest[]> {
    const requests = Array.from(this.contentRequests.values());
    return requests
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, limit);
  }

  async createContentRequest(request: Omit<ContentRequest, 'id' | 'requestCount' | 'createdAt'>): Promise<ContentRequest> {
    // Check if similar request already exists
    const existing = Array.from(this.contentRequests.values()).find(
      r => r.title.toLowerCase() === request.title.toLowerCase() && r.contentType === request.contentType
    );

    if (existing) {
      // Increment request count
      existing.requestCount++;
      this.saveData();
      return existing;
    }

    // Create new request
    const id = randomUUID();
    const newRequest: ContentRequest = {
      ...request,
      id,
      requestCount: 1,
      createdAt: new Date().toISOString(),
    };
    this.contentRequests.set(id, newRequest);
    this.saveData();
    return newRequest;
  }

  // Issue Reports
  async getAllIssueReports(): Promise<IssueReport[]> {
    return Array.from(this.issueReports.values());
  }

  async createIssueReport(report: Omit<IssueReport, 'id' | 'status' | 'createdAt'>): Promise<IssueReport> {
    const id = randomUUID();
    const newReport: IssueReport = {
      ...report,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.issueReports.set(id, newReport);
    this.saveData();
    return newReport;
  }
}

export const storage = new MemStorage();
