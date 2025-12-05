import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Star, Clock, TrendingUp, Film, Tv, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import type { Show, Movie } from "@shared/schema";
import { Link } from "wouter";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  suggestions?: string[];
  showLinks?: Array<{ title: string; slug: string; type: 'show' | 'movie'; rating?: string; year?: number; poster?: string }>;
  quickActions?: Array<{ label: string; icon: string; action: string }>;
}

interface ConversationContext {
  lastGenre?: string;
  lastType?: 'show' | 'movie';
  searchHistory: string[];
  recommendedIds: string[];
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hey there! I'm Vault, your personal streaming assistant. I can help you discover amazing content!\n\nTry asking me things like:\n• \"Recommend something like Breaking Bad\"\n• \"What's a good horror movie?\"\n• \"Surprise me with something good\"",
      isBot: true,
      suggestions: [
        "🎲 Surprise me",
        "🔥 What's hot?",
        "🎬 Top rated movies",
        "📺 Popular shows",
      ],
      quickActions: [
        { label: "Random Pick", icon: "🎲", action: "surprise" },
        { label: "Trending", icon: "🔥", action: "trending" },
        { label: "Top Rated", icon: "⭐", action: "top-rated" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ConversationContext>({
    searchHistory: [],
    recommendedIds: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: shows } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  const { data: movies } = useQuery<Movie[]>({
    queryKey: ["/api/movies"],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fuzzy search with scoring
  const fuzzyMatch = (text: string, query: string): number => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    if (lowerText === lowerQuery) return 100;
    if (lowerText.includes(lowerQuery)) return 80;
    if (lowerText.startsWith(lowerQuery)) return 90;
    
    // Check word matches
    const textWords = lowerText.split(/\s+/);
    const queryWords = lowerQuery.split(/\s+/);
    let matchScore = 0;
    
    for (const qWord of queryWords) {
      for (const tWord of textWords) {
        if (tWord.includes(qWord) || qWord.includes(tWord)) {
          matchScore += 20;
        }
      }
    }
    
    return matchScore;
  };

  const findShows = (query: string, limit = 5): Show[] => {
    if (!shows) return [];
    
    const scored = shows.map(show => {
      const titleScore = fuzzyMatch(show.title, query);
      const genreScore = fuzzyMatch(show.genres || '', query) * 0.5;
      const castScore = fuzzyMatch(show.cast || '', query) * 0.3;
      const descScore = fuzzyMatch(show.description || '', query) * 0.2;
      
      return {
        show,
        score: titleScore + genreScore + castScore + descScore
      };
    });
    
    return scored
      .filter(s => s.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.show);
  };

  const findMovies = (query: string, limit = 5): Movie[] => {
    if (!movies) return [];
    
    const scored = movies.map(movie => {
      const titleScore = fuzzyMatch(movie.title, query);
      const genreScore = fuzzyMatch(movie.genres || '', query) * 0.5;
      const castScore = fuzzyMatch(movie.cast || '', query) * 0.3;
      const descScore = fuzzyMatch(movie.description || '', query) * 0.2;
      
      return {
        movie,
        score: titleScore + genreScore + castScore + descScore
      };
    });
    
    return scored
      .filter(m => m.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(m => m.movie);
  };

  // Get similar content based on genres
  const getSimilarContent = (title: string): (Show | Movie)[] => {
    const allContent = [...(shows || []), ...(movies || [])];
    const source = allContent.find(c => c.title.toLowerCase().includes(title.toLowerCase()));
    
    if (!source) return [];
    
    const sourceGenres = source.genres?.toLowerCase().split(',').map(g => g.trim()) || [];
    
    return allContent
      .filter(c => c.id !== source.id)
      .map(c => {
        const cGenres = c.genres?.toLowerCase().split(',').map(g => g.trim()) || [];
        const matchCount = sourceGenres.filter(g => cGenres.includes(g)).length;
        return { content: c, matchCount };
      })
      .filter(c => c.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 5)
      .map(c => c.content);
  };

  // Get random recommendation
  const getRandomPick = (): (Show | Movie) | null => {
    const allContent = [...(shows || []), ...(movies || [])];
    const highRated = allContent.filter(c => parseFloat(c.imdbRating || '0') >= 7.5);
    if (highRated.length === 0) return null;
    return highRated[Math.floor(Math.random() * highRated.length)];
  };

  // Get top rated content
  const getTopRated = (type?: 'show' | 'movie', limit = 5): (Show | Movie)[] => {
    let content: (Show | Movie)[] = [];
    
    if (type === 'movie') {
      content = [...(movies || [])];
    } else if (type === 'show') {
      content = [...(shows || [])];
    } else {
      content = [...(shows || []), ...(movies || [])];
    }
    
    return content
      .sort((a, b) => parseFloat(b.imdbRating || '0') - parseFloat(a.imdbRating || '0'))
      .slice(0, limit);
  };

  // Get content by mood/vibe
  const getByMood = (mood: string): (Show | Movie)[] => {
    const moodGenres: Record<string, string[]> = {
      'happy': ['comedy', 'animation', 'family'],
      'sad': ['drama', 'romance'],
      'excited': ['action', 'thriller', 'adventure'],
      'scared': ['horror', 'mystery', 'thriller'],
      'romantic': ['romance', 'drama'],
      'thoughtful': ['documentary', 'drama', 'mystery'],
      'relaxed': ['comedy', 'animation', 'family'],
      'adventurous': ['action', 'adventure', 'sci-fi', 'fantasy'],
    };
    
    const genres = moodGenres[mood.toLowerCase()] || [];
    const allContent = [...(shows || []), ...(movies || [])];
    
    return allContent
      .filter(c => {
        const cGenres = c.genres?.toLowerCase() || '';
        return genres.some(g => cGenres.includes(g));
      })
      .sort((a, b) => parseFloat(b.imdbRating || '0') - parseFloat(a.imdbRating || '0'))
      .slice(0, 5);
  };

  // Helper to check if item is a movie
  const isMovie = (item: Show | Movie): item is Movie => {
    return 'googleDriveUrl' in item;
  };

  // Format content for display
  const formatContent = (items: (Show | Movie)[]): Array<{ title: string; slug: string; type: 'show' | 'movie'; rating?: string; year?: number }> => {
    return items.map(item => ({
      title: item.title,
      slug: item.slug,
      type: isMovie(item) ? 'movie' as const : 'show' as const,
      rating: item.imdbRating || undefined,
      year: item.year,
    }));
  };

  const generateResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();

    // Update context with search history
    setContext(prev => ({
      ...prev,
      searchHistory: [...prev.searchHistory.slice(-5), userMessage],
    }));

    // ===== SURPRISE ME / RANDOM =====
    if (
      lowerMessage.includes("surprise") ||
      lowerMessage.includes("random") ||
      lowerMessage.includes("🎲") ||
      lowerMessage.includes("anything") ||
      lowerMessage.includes("don't know") ||
      lowerMessage.includes("dont know")
    ) {
      const pick = getRandomPick();
      if (pick) {
        const type = isMovie(pick) ? 'movie' : 'show';
        return {
          id: Date.now().toString(),
          text: `🎲 Here's my pick for you!\n\n**${pick.title}** (${pick.year})\n⭐ ${pick.imdbRating || 'N/A'}/10\n\n${pick.description?.slice(0, 150)}...`,
          isBot: true,
          showLinks: [{ title: pick.title, slug: pick.slug, type, rating: pick.imdbRating || undefined, year: pick.year }],
          suggestions: ["🎲 Another one!", "Similar to this", "Top rated instead"],
        };
      }
    }

    // ===== SIMILAR TO / LIKE =====
    const similarMatch = lowerMessage.match(/(?:similar to|like|recommend.*like|something like)\s+(.+)/i);
    if (similarMatch) {
      const title = similarMatch[1].replace(/['"]/g, '').trim();
      const similar = getSimilarContent(title);
      
      if (similar.length > 0) {
        return {
          id: Date.now().toString(),
          text: `🎯 If you liked "${title}", you might enjoy these:`,
          isBot: true,
          showLinks: formatContent(similar),
          suggestions: ["🎲 Surprise me", "Top rated", "More recommendations"],
        };
      } else {
        return {
          id: Date.now().toString(),
          text: `I couldn't find "${title}" in our library. Try a different title or browse by genre!`,
          isBot: true,
          suggestions: ["Browse genres", "🔥 What's trending", "Top rated"],
        };
      }
    }

    // ===== MOOD-BASED =====
    const moods = ['happy', 'sad', 'excited', 'scared', 'romantic', 'thoughtful', 'relaxed', 'adventurous'];
    const foundMood = moods.find(m => lowerMessage.includes(m));
    if (foundMood || lowerMessage.includes("mood") || lowerMessage.includes("feel like")) {
      const mood = foundMood || 'excited';
      const moodContent = getByMood(mood);
      
      if (moodContent.length > 0) {
        const emoji = { happy: '😊', sad: '😢', excited: '🔥', scared: '😱', romantic: '💕', thoughtful: '🤔', relaxed: '😌', adventurous: '🗺️' }[mood] || '🎬';
        return {
          id: Date.now().toString(),
          text: `${emoji} Perfect picks for your ${mood} mood:`,
          isBot: true,
          showLinks: formatContent(moodContent),
          suggestions: ["Different mood", "🎲 Surprise me", "Top rated"],
        };
      }
    }

    // ===== TOP RATED =====
    if (
      lowerMessage.includes("top rated") ||
      lowerMessage.includes("best") ||
      lowerMessage.includes("highest rated") ||
      lowerMessage.includes("⭐")
    ) {
      const type = lowerMessage.includes("movie") ? 'movie' : lowerMessage.includes("show") ? 'show' : undefined;
      const topRated = getTopRated(type, 5);
      
      if (topRated.length > 0) {
        const label = type === 'movie' ? 'movies' : type === 'show' ? 'shows' : 'titles';
        return {
          id: Date.now().toString(),
          text: `⭐ Top rated ${label} in our library:`,
          isBot: true,
          showLinks: formatContent(topRated),
          suggestions: ["Top movies", "Top shows", "🎲 Surprise me"],
        };
      }
    }

    // ===== TRENDING / HOT =====
    if (
      lowerMessage.includes("trending") ||
      lowerMessage.includes("popular") ||
      lowerMessage.includes("hot") ||
      lowerMessage.includes("🔥")
    ) {
      const trendingShows = shows?.filter(s => s.trending).slice(0, 3) || [];
      const trendingMovies = movies?.filter(m => m.trending).slice(0, 2) || [];
      const combined = [...trendingShows, ...trendingMovies];
      
      if (combined.length > 0) {
        return {
          id: Date.now().toString(),
          text: "🔥 What's hot right now:",
          isBot: true,
          showLinks: formatContent(combined),
          suggestions: ["Top rated", "🎲 Surprise me", "Browse genres"],
        };
      }
    }

    // ===== SPECIFIC EPISODE =====
    const episodeMatch = userMessage.match(/(.+?)\s*(?:season|s)\s*(\d+)\s*(?:episode|ep|e)\s*(\d+)/i);
    if (episodeMatch) {
      const showName = episodeMatch[1].trim();
      const season = episodeMatch[2];
      const episode = episodeMatch[3];
      
      const foundShow = shows?.find(s => 
        s.title.toLowerCase().includes(showName.toLowerCase())
      );
      
      if (foundShow) {
        return {
          id: Date.now().toString(),
          text: `🎬 Found it! Click to watch ${foundShow.title} S${season}E${episode}:`,
          isBot: true,
          showLinks: [{
            title: `▶️ ${foundShow.title} - Season ${season}, Episode ${episode}`,
            slug: `${foundShow.slug}?season=${season}&episode=${episode}`,
            type: 'show' as const,
          }],
          suggestions: ["Next episode", "Show info", "Find another show"],
        };
      }
    }

    // ===== GENRE SEARCHES =====
    const genreKeywords: Record<string, string[]> = {
      'action': ['action', 'thriller', 'adventure'],
      'comedy': ['comedy', 'funny', 'laugh'],
      'drama': ['drama', 'emotional', 'serious'],
      'horror': ['horror', 'scary', 'creepy', 'spooky'],
      'romance': ['romance', 'romantic', 'love'],
      'scifi': ['sci-fi', 'science fiction', 'space', 'futuristic'],
      'fantasy': ['fantasy', 'magic', 'magical'],
      'crime': ['crime', 'detective', 'mystery', 'murder'],
      'documentary': ['documentary', 'doc', 'real'],
      'animation': ['animation', 'animated', 'cartoon', 'anime'],
    };

    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(k => lowerMessage.includes(k))) {
        const allContent = [...(shows || []), ...(movies || [])];
        const genreContent = allContent
          .filter(c => {
            const cGenres = c.genres?.toLowerCase() || '';
            return keywords.some(k => cGenres.includes(k));
          })
          .sort((a, b) => parseFloat(b.imdbRating || '0') - parseFloat(a.imdbRating || '0'))
          .slice(0, 5);
        
        if (genreContent.length > 0) {
          const emoji = { action: '💥', comedy: '😂', drama: '🎭', horror: '👻', romance: '💕', scifi: '🚀', fantasy: '✨', crime: '🔍', documentary: '📹', animation: '🎨' }[genre] || '🎬';
          return {
            id: Date.now().toString(),
            text: `${emoji} Best ${genre} content for you:`,
            isBot: true,
            showLinks: formatContent(genreContent),
            suggestions: ["More genres", "🎲 Surprise me", "Top rated"],
          };
        }
      }
    }

    // ===== MOVIES SPECIFICALLY =====
    if (lowerMessage.includes("movie") || lowerMessage.includes("film")) {
      const matchedMovies = findMovies(userMessage.replace(/movie|film/gi, '').trim(), 5);
      
      if (matchedMovies.length > 0) {
        return {
          id: Date.now().toString(),
          text: `🎬 Found ${matchedMovies.length} movie(s):`,
          isBot: true,
          showLinks: formatContent(matchedMovies),
          suggestions: ["Top rated movies", "🎲 Random movie", "Browse shows"],
        };
      }
      
      // Show top movies if no specific match
      const topMovies = getTopRated('movie', 5);
      return {
        id: Date.now().toString(),
        text: "🎬 Here are some great movies to watch:",
        isBot: true,
        showLinks: formatContent(topMovies),
        suggestions: ["Action movies", "Comedy movies", "Horror movies"],
      };
    }

    // ===== SHOWS SPECIFICALLY =====
    if (lowerMessage.includes("show") || lowerMessage.includes("series") || lowerMessage.includes("tv")) {
      const matchedShows = findShows(userMessage.replace(/show|series|tv/gi, '').trim(), 5);
      
      if (matchedShows.length > 0) {
        return {
          id: Date.now().toString(),
          text: `📺 Found ${matchedShows.length} show(s):`,
          isBot: true,
          showLinks: formatContent(matchedShows),
          suggestions: ["Top rated shows", "🎲 Random show", "Browse movies"],
        };
      }
      
      const topShows = getTopRated('show', 5);
      return {
        id: Date.now().toString(),
        text: "📺 Here are some great shows to binge:",
        isBot: true,
        showLinks: formatContent(topShows),
        suggestions: ["Action shows", "Drama shows", "Comedy shows"],
      };
    }

    // ===== GENERAL SEARCH =====
    const matchedShows = findShows(userMessage, 3);
    const matchedMovies = findMovies(userMessage, 3);
    
    if (matchedShows.length > 0 || matchedMovies.length > 0) {
      const combined = [...matchedShows, ...matchedMovies].slice(0, 5);
      return {
        id: Date.now().toString(),
        text: `🔍 Found ${combined.length} result(s):`,
        isBot: true,
        showLinks: formatContent(combined),
        suggestions: ["Similar content", "🎲 Surprise me", "Browse genres"],
      };
    }

    // ===== HELP / PLAYBACK ISSUES =====
    if (
      lowerMessage.includes("help") ||
      lowerMessage.includes("not working") ||
      lowerMessage.includes("error") ||
      lowerMessage.includes("problem") ||
      lowerMessage.includes("issue")
    ) {
      return {
        id: Date.now().toString(),
        text: "🔧 **Troubleshooting Tips:**\n\n1. 🔄 Refresh the page\n2. 🧹 Clear browser cache\n3. 🌐 Try a different browser\n4. 📶 Check internet connection\n5. 🚫 Disable ad blockers\n\nStill stuck? Report the issue!",
        isBot: true,
        suggestions: ["Report issue", "Contact support", "Try another title"],
      };
    }

    // ===== WATCHLIST =====
    if (lowerMessage.includes("watchlist") || lowerMessage.includes("save") || lowerMessage.includes("bookmark")) {
      return {
        id: Date.now().toString(),
        text: "📚 **Your Watchlist:**\n\n• Click the ❤️ button on any show/movie\n• Access from the header menu\n• Saved locally in your browser\n\nStart building your list!",
        isBot: true,
        suggestions: ["Browse shows", "Browse movies", "🔥 Trending"],
      };
    }

    // ===== GREETINGS =====
    if (
      lowerMessage.match(/^(hi|hello|hey|yo|sup|hola|howdy)/i)
    ) {
      return {
        id: Date.now().toString(),
        text: "👋 Hey! Ready to find something awesome to watch?\n\nI can help you:\n• 🎲 Get a random recommendation\n• 🔍 Find specific titles\n• 🎭 Browse by genre or mood\n• ⭐ See top rated content",
        isBot: true,
        suggestions: ["🎲 Surprise me", "🔥 What's hot", "⭐ Top rated", "Browse genres"],
      };
    }

    // ===== DEFAULT RESPONSE =====
    return {
      id: Date.now().toString(),
      text: "🤔 I'm not sure what you're looking for. Try:\n\n• **\"Surprise me\"** - Random pick\n• **\"Something like Breaking Bad\"** - Similar content\n• **\"I'm feeling happy\"** - Mood-based\n• **\"Best horror movies\"** - Genre search\n• **\"Stranger Things s1e1\"** - Specific episode",
      isBot: true,
      suggestions: ["🎲 Surprise me", "🔥 Trending", "⭐ Top rated", "Browse genres"],
    };
  };

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Show typing indicator
    setIsTyping(true);

    // Generate bot response after delay
    setTimeout(() => {
      const botResponse = generateResponse(messageText);
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[100]" style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
          size="icon"
          data-testid="button-open-chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] h-[600px] max-h-[80vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col z-[100] animate-in slide-in-from-bottom-5 duration-300"
      style={{ position: 'fixed', bottom: '24px', right: '24px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Vault AI</h3>
            <p className="text-xs opacity-90 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online • Ready to help
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          data-testid="button-close-chatbot"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chatbot-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.isBot
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.text}</p>

              {/* Show/Movie links */}
              {message.showLinks && message.showLinks.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.showLinks.map((item) => {
                    // Handle different URL formats
                    let href;
                    if (item.type === 'movie') {
                      href = `/movie/${item.slug}`;
                    } else if (item.slug.includes('?season=')) {
                      // Episode link with query params
                      href = `/watch/${item.slug}`;
                    } else {
                      // Regular show link
                      href = `/show/${item.slug}`;
                    }
                    const icon = item.type === 'movie' ? '🎬' : '📺';
                    
                    return (
                      <Link key={item.slug} href={href}>
                        <div
                          className="text-sm bg-background hover:bg-accent p-2 rounded border border-border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex-1 truncate">{icon} {item.title}</span>
                            {item.rating && (
                              <span className="text-xs text-yellow-500 shrink-0">⭐ {item.rating}</span>
                            )}
                          </div>
                          {item.year && (
                            <span className="text-xs text-muted-foreground">{item.year}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs bg-background hover:bg-accent px-3 py-1 rounded-full border border-border transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            data-testid="input-chatbot"
          />
          <Button type="submit" size="icon" data-testid="button-send-message">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
