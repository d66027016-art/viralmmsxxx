"use client";

import Link from "next/link";
import { Play, Eye, Flame, Clock, Award } from "lucide-react";

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnail: string;
    duration: string;
    views: number;
    qualities: string;
  };
}

export default function ContentCard({ content }: ContentCardProps) {
  // Determine if it's a popular item (views > 10,000)
  const isTrending = content.views >= 10000;

  return (
    <Link 
      href={`/watch/${content.id}`} 
      className="group block relative rounded-2xl overflow-hidden glass-panel glass-panel-hover border border-white/5 bg-[#121218]/40 shadow-lg shadow-black/45 transition-all duration-300"
    >
      {/* Thumbnail Wrapper */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        <img
          src={content.thumbnail}
          alt={content.title}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Shading overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

        {/* Quality Badges */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-purple-600/90 backdrop-blur-sm text-[10px] font-black text-white uppercase tracking-wider border border-purple-400/30 shadow-md shadow-purple-950/40">
            {content.qualities.split(",")[0] || "1080p"}
          </span>
        </div>

        {/* Trending Badge */}
        {isTrending && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/90 backdrop-blur-sm text-[10px] font-bold text-white shadow-md shadow-rose-950/30 border border-rose-400/25">
            <Flame className="h-3 w-3 text-yellow-300 fill-yellow-300" />
            Trending
          </div>
        )}

        {/* Play Icon pop-up on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="h-12 w-12 rounded-full bg-purple-500/90 hover:bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-950/50 hover:scale-110 transform transition-all duration-200">
            <Play className="h-5 w-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration pill in bottom right */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-semibold text-zinc-300">
          <Clock className="h-3 w-3 text-purple-400" />
          {content.duration}
        </div>
      </div>

      {/* Details Area */}
      <div className="p-4 space-y-2 bg-gradient-to-b from-[#121218]/80 to-[#0c0c0e]/95">
        
        {/* Category & Stats row */}
        <div className="flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-400">
            {content.category}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <Eye className="h-3.5 w-3.5 text-zinc-600" />
            <span>{content.views.toLocaleString()} views</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-purple-400 line-clamp-1 transition-colors duration-300">
          {content.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed h-8 font-light">
          {content.description}
        </p>
        
      </div>
    </Link>
  );
}
