"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import DownloadManager from "@/components/DownloadManager";
import ContentCard from "@/components/ContentCard";
import Link from "next/link";
import { 
  Heart, Download, Share2, Sparkles, MessageCircle, 
  CornerDownRight, ArrowRight, Eye, Calendar, Clock, ThumbsUp
} from "lucide-react";
import { toggleFavorite, isFavorited, updateWatchProgress } from "@/app/actions/content";
import { useRouter } from "next/navigation";

interface WatchPageClientProps {
  user: {
    userId: string;
    name: string;
    email: string;
    subscription: string;
  } | null;
  content: {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string;
    thumbnail: string;
    videoUrl: string;
    duration: string;
    views: number;
    likes: number;
    qualities: string;
  };
  initialProgress: number;
  recommendations: any[];
}

export default function WatchPageClient({ 
  user, 
  content, 
  initialProgress, 
  recommendations 
}: WatchPageClientProps) {
  const router = useRouter();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(content.likes);
  const [isLiked, setIsLiked] = useState(false);

  // Mocks comments list
  const [comments, setComments] = useState([
    { id: 1, author: "CinematicFan_99", text: "Holy cow, the HD adaptive stream started in like 200 milliseconds! Absolute premium quality.", date: "2 hours ago", avatar: "C" },
    { id: 2, author: "Alice_Walker", text: "Beautiful visuals. The skip intro button works flawlessly. Perfect streaming room setup.", date: "1 day ago", avatar: "A" }
  ]);
  const [newCommentText, setNewCommentText] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      const favorited = await isFavorited(content.id);
      setInWatchlist(favorited);
    };
    checkStatus();
  }, [content.id]);

  const handleWatchlistToggle = async () => {
    setWatchlistLoading(true);
    const res = await toggleFavorite(content.id);
    if (res.success) {
      setInWatchlist(!!res.favorited);
    } else {
      alert(res.error || "Please log in to save videos to your watchlist.");
    }
    setWatchlistLoading(false);
    router.refresh();
  };

  const handleLikeToggle = () => {
    if (isLiked) {
      setLikesCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setIsLiked(true);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setComments(prev => [
      {
        id: Date.now(),
        author: user?.name || "Anonymous Guest",
        text: newCommentText.trim(),
        date: "Just now",
        avatar: (user?.name || "A").charAt(0).toUpperCase()
      },
      ...prev
    ]);
    setNewCommentText("");
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Shared Navbar */}
      <Navbar user={user} />

      {/* Main Grid Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Player & Metadata */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom Video Player Container */}
          <section className="relative w-full shadow-2xl rounded-3xl overflow-hidden bg-black">
            <VideoPlayer
              contentId={content.id}
              videoUrl={content.videoUrl}
              title={content.title}
              initialProgress={initialProgress}
              onNext={() => {
                if (recommendations[0]) {
                  router.push(`/watch/${recommendations[0].id}`);
                }
              }}
            />
          </section>

          {/* Action widgets & Details */}
          <section className="p-6 rounded-3xl glass-panel bg-zinc-900/10 border border-white/5 space-y-6">
            
            {/* Title & Stats */}
            <div className="space-y-3 pb-5 border-b border-white/5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400">
                  {content.category}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Clock className="h-3.5 w-3.5" />
                  {content.duration}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Eye className="h-3.5 w-3.5" />
                  {content.views.toLocaleString()} views
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {content.title}
              </h1>
            </div>

            {/* Interactive Control Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-1 border-b border-white/5 pb-5">
              <div className="flex flex-wrap items-center gap-2.5">
                
                {/* Like Button */}
                <button
                  onClick={handleLikeToggle}
                  className={`flex items-center gap-1.5 h-9 px-4 rounded-xl border text-xs font-bold transition-all duration-200 ${
                    isLiked
                      ? "bg-purple-600/10 border-purple-500 text-purple-400"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:border-white/20"
                  }`}
                >
                  <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-purple-400" : ""}`} />
                  <span>{likesCount} Likes</span>
                </button>

                {/* Watchlist Button */}
                <button
                  onClick={handleWatchlistToggle}
                  disabled={watchlistLoading}
                  className={`flex items-center gap-1.5 h-9 px-4 rounded-xl border text-xs font-bold transition-all duration-200 ${
                    inWatchlist
                      ? "bg-purple-600/10 border-purple-500 text-purple-400"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:border-white/20"
                  }`}
                >
                  {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </button>

              </div>

              {/* Download trigger button */}
              <button
                onClick={() => setDownloadModalOpen(true)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-xs font-bold text-white shadow-md shadow-purple-950/20 active:scale-95 transition-all duration-300"
              >
                <Download className="h-4 w-4" />
                Download Content
              </button>
            </div>

            {/* Movie Description Text */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Overview & Description
              </h3>
              <p className="text-sm text-zinc-300 font-light leading-relaxed">
                {content.description}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-1">Tags:</span>
                {content.tags.split(",").map((tag) => (
                  <span 
                    key={tag} 
                    className="text-[11px] text-purple-400 hover:underline cursor-pointer"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>

          </section>

          {/* User Comments section */}
          <section className="p-6 rounded-3xl glass-panel bg-zinc-900/10 border border-white/5 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-purple-400" />
              Community Discussion ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-xs border border-white/10">
                {(user?.name || "G").charAt(0).toUpperCase()}
              </div>
              <div className="w-full space-y-2">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Share your thoughts on this premium HD stream..."
                  className="w-full min-h-[70px] p-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 font-bold text-[10px] text-white hover:border-purple-500/35 transition-colors self-end"
                >
                  Submit Comment
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4 pt-2">
              {comments.map((cmt) => (
                <div key={cmt.id} className="flex gap-3 text-left border-b border-white/5 pb-4 last:border-0 last:pb-0 animate-in fade-in duration-300">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-xs border border-white/5">
                    {cmt.avatar}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200">{cmt.author}</span>
                      <span className="text-[9px] text-zinc-500">{cmt.date}</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">
                      {cmt.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </section>

        </div>

        {/* Right Column: Sidebar recommendations & Subscription upgrade info */}
        <div className="space-y-6">
          
          {/* Subscription Upgrade Box */}
          {user?.subscription !== "premium" && (
            <div className="p-5 rounded-2xl glass-panel bg-gradient-to-br from-purple-950/20 via-zinc-950 to-zinc-950 border border-purple-500/25 space-y-4 shadow-xl">
              <span className="flex items-center gap-1 text-[9px] font-black tracking-widest text-purple-400 uppercase">
                <Sparkles className="h-3.5 w-3.5 fill-purple-400" />
                VIP ENHANCEMENTS
              </span>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white">Stream in full 4K UHD?</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                  Upgrade your membership plan right now to VIP status to unlock full quality stream rates, unthrottled downloads, and unlimited storage vault space.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center h-8 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold text-[10px] text-white active:scale-95 transition-all duration-300"
              >
                Go Premium
              </Link>
            </div>
          )}

          {/* Up Next List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <CornerDownRight className="h-4 w-4 text-purple-400" />
              Up Next Recommendation
            </h3>

            <div className="space-y-4">
              {recommendations.map((video) => (
                <Link
                  key={video.id}
                  href={`/watch/${video.id}`}
                  className="flex gap-3 p-2.5 rounded-xl glass-panel border border-white/5 bg-[#121218]/30 hover:border-purple-500/40 transition-all duration-300 group"
                >
                  <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-zinc-950 shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[8px] font-medium text-zinc-300">
                      {video.duration}
                    </div>
                  </div>

                  <div className="space-y-1 text-left min-w-0">
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-[8px] font-semibold text-indigo-400">
                      {video.category}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-200 line-clamp-1 group-hover:text-purple-400 transition-colors leading-tight">
                      {video.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium">
                      {video.views.toLocaleString()} views
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* Download Modal component */}
      {downloadModalOpen && (
        <DownloadManager
          contentId={content.id}
          title={content.title}
          onClose={() => setDownloadModalOpen(false)}
        />
      )}

      {/* Page Footer */}
      <footer className="w-full glass-panel border-t border-white/5 bg-[#09090b]/80 py-6 text-center text-xs text-zinc-600 mt-20">
        &copy; {new Date().getFullYear()} Viral MMS Cinema Room. Premium streaming player demo.
      </footer>
    </div>
  );
}
