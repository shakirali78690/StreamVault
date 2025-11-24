import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Movie } from "@shared/schema";
import { Link } from "wouter";

interface MovieHeroCarouselProps {
  movies: Movie[];
}

export function MovieHeroCarousel({ movies }: MovieHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || movies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, movies.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setIsAutoPlaying(false);
  };

  if (movies.length === 0) return null;

  const currentMovie = movies[currentIndex];

  return (
    <div className="relative h-[80vh] overflow-hidden">
      {/* Background Image with Gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${currentMovie.backdropUrl})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl">
          <Badge className="mb-4" variant="secondary">
            Featured Movie
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            {currentMovie.title}
          </h1>

          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="font-semibold">{currentMovie.year}</span>
            <span>•</span>
            <span>{currentMovie.duration} min</span>
            <span>•</span>
            <Badge variant="outline">{currentMovie.rating}</Badge>
            {currentMovie.imdbRating && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{currentMovie.imdbRating}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {currentMovie.genres?.split(',').slice(0, 3).map((genre) => (
              <Badge key={genre.trim()} variant="secondary">
                {genre.trim()}
              </Badge>
            ))}
          </div>

          <p className="text-lg text-muted-foreground mb-8 line-clamp-3 max-w-xl drop-shadow">
            {currentMovie.description}
          </p>

          <div className="flex gap-4">
            <Link href={`/watch-movie/${currentMovie.slug}`}>
              <Button size="lg" className="gap-2">
                <Play className="w-5 h-5" />
                Watch Now
              </Button>
            </Link>
            <Link href={`/movie/${currentMovie.slug}`}>
              <Button size="lg" variant="secondary" className="gap-2">
                <Info className="w-5 h-5" />
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {movies.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {movies.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
