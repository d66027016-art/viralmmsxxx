"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Plus, Check, Star, Info, Flame } from "lucide-react";
import { toggleFavorite, isFavorited } from "@/app/actions/content";
import { useRouter } from "next/navigation";

interface FeaturedBannerProps {
  content: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnail: string;
    duration: string;
    views: number;
    likes: number;
  };
}

export default function FeaturedBanner({ content }: FeaturedBannerProps) {
  const router = useRouter();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const favorited = await isFavorited(content.id);
      setInWatchlist(favorited);
    };
    checkStatus();
  }, [content.id]);

  const handleWatchlistToggle = async () => {
    setIsLoading(true);
    const res = await toggleFavorite(content.id);
    if (res.success) {
      setInWatchlist(!!res.favorited);
    }
    setIsLoading(false);
    router.refresh();
  };

  return (
    <div className="relative w-full min-h-[500px] md:min-h-[600px] flex items-end rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-zinc-950 select-none animate-in fade-in duration-700">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0">
        <img
          src={content.thumbnail}
          alt={content.title}
          className="w-full h-full object-cover object-center scale-100 hover:scale-[1.01] transition-transform duration-[6000ms]"
        />
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/65 to-transparent z-1" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/30 to-transparent z-1" />
        <div className="absolute inset-0 bg-[#09090b]/15 backdrop-blur-[1px] z-1" />
      </div>

      {/* Hero Content Panel */}
      <div className="relative z-10 p-6 sm:p-10 md:p-14 max-w-3xl space-y-6">
        
        {/* Banner Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-purple-600/90 text-[10px] font-black text-white tracking-widest uppercase border border-purple-400/25 shadow-lg shadow-purple-950/20">
            <Flame className="h-3 w-3 fill-white" />
            FEATURED BLOCKBUSTER
          </span>
          <span className="px-2.5 py-0.5 rounded bg-white/10 backdrop-blur-md text-[10px] font-bold text-zinc-300 border border-white/5">
            {content.category}
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            {content.duration}
          </span>
        </div>

        {/* Cinematic Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          {content.title}
        </h1>

        {/* Detailed description */}
        <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed max-w-2xl drop-shadow-md">
          {content.description}
        </p>

        {/* Action Button Set */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          
          {/* Stream Now button */}
          <Link
            href={`/watch/${content.id}`}
            className="flex items-center justify-center gap-2 h-12 px-6 sm:px-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-400 hover:to-pink-500 font-bold text-sm text-white shadow-xl shadow-purple-950/30 hover:scale-[1.03] active:scale-[0.97] transform transition-all duration-300"
          >
            <Play className="h-4.5 w-4.5 fill-white ml-0.5" />
            Watch Trailer Now
          </Link>

          {/* Watchlist toggle */}
          <button
            onClick={handleWatchlistToggle}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 h-12 px-6 rounded-full border backdrop-blur-md font-bold text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
              inWatchlist 
                ? "bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/35"
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            }`}
          >
            {isLoading ? (
              <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : inWatchlist ? (
              <Check className="h-4.5 w-4.5" />
            ) : (
              <Plus className="h-4.5 w-4.5" />
            )}
            My Watchlist
          </button>

        </div>

      </div>

    </div>
  );
}
