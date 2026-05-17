import { getCurrentUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import FeaturedBanner from "@/components/FeaturedBanner";
import ContentCard from "@/components/ContentCard";
import Link from "next/link";
import { Sparkles, ArrowRight, Play, Clock } from "lucide-react";

export const revalidate = 0; // Disable static cache to allow instant updates from seed/actions

export default async function HomePage() {
  const user = await getCurrentUser();

  // Fetch all videos from Prisma SQLite
  const allContent = await prisma.content.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (allContent.length === 0) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading premium media catalog...</p>
      </div>
    );
  }

  // 1. Featured Banner (Pick highest view/trending item)
  const featuredItem = allContent.reduce((prev, current) => 
    (prev.views > current.views) ? prev : current
  );

  // 2. Trending Now (items with high view count, sorted by view desc)
  const trendingContent = [...allContent]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  // 3. Recommended for You (shuffle or select top matches, let's take a slice)
  const recommendedContent = [...allContent]
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  // 4. Latest Releases
  const latestContent = allContent.slice(0, 4);

  // 5. Continue Watching (fetch user watch history if logged in)
  let continueWatching: any[] = [];
  if (user) {
    continueWatching = await prisma.watchHistory.findMany({
      where: { 
        userId: user.userId,
        progress: { lt: 95 } // Only show if not fully finished
      },
      include: { content: true },
      orderBy: { lastWatched: "desc" },
      take: 4,
    });
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Dynamic Navbar */}
      <Navbar user={user} />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Cinematic Featured Banner */}
        <section>
          <FeaturedBanner content={featuredItem} />
        </section>

        {/* Dynamic CONTINUE WATCHING Shelf */}
        {user && continueWatching.length > 0 && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                <span className="h-5 w-1 bg-purple-500 rounded-full" />
                Continue Watching
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {continueWatching.map((item) => (
                <Link
                  key={item.id}
                  href={`/watch/${item.content.id}`}
                  className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel border border-white/5 bg-zinc-950/40 p-3 hover:border-purple-500/40 transition-all duration-300"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 mb-3">
                    <img 
                      src={item.content.thumbnail} 
                      alt={item.content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                      <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                      <div 
                        className="h-full bg-purple-500" 
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="px-1 space-y-1">
                    <h3 className="text-xs font-bold text-zinc-200 line-clamp-1 group-hover:text-purple-400 transition-colors">
                      {item.content.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold">
                      <Clock className="h-3 w-3" />
                      <span>{item.progress.toFixed(0)}% watched</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 2. Trending Now Shelf */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <span className="h-5 w-1 bg-purple-500 rounded-full" />
              Trending Now
            </h2>
            <Link 
              href="/browse?sort=popular"
              className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              See All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {trendingContent.map((video) => (
              <ContentCard key={video.id} content={video} />
            ))}
          </div>
        </section>

        {/* 3. Recommended for You Shelf */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <span className="h-5 w-1 bg-purple-500 rounded-full" />
              Recommended for You
            </h2>
            <Link 
              href="/browse"
              className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Discover
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recommendedContent.map((video) => (
              <ContentCard key={video.id} content={video} />
            ))}
          </div>
        </section>

        {/* Premium Upgrade CTA Section */}
        {user?.subscription !== "premium" && (
          <section className="relative p-6 sm:p-10 rounded-3xl glass-panel bg-gradient-to-r from-zinc-950 via-purple-950/20 to-zinc-950 border border-purple-500/20 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-1/4 h-24 w-24 bg-purple-500/10 rounded-full blur-3xl z-0" />
            <div className="relative z-10 space-y-2 max-w-xl text-center md:text-left">
              <span className="flex items-center justify-center md:justify-start gap-1 text-[10px] font-black tracking-widest text-purple-400 uppercase">
                <Sparkles className="h-3.5 w-3.5 fill-purple-400 animate-pulse" />
                UNLEASH ULTRABITRATE
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                Upgrade to Premium VIP Access
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                Unlock exclusive 4K streaming streams, bypass skip intro overlays automatically, and download unlimited web content onto your local vault for offline access.
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-lg shadow-purple-950/30 hover:scale-[1.03] active:scale-[0.97] transform transition-all duration-300"
              >
                Go Premium Now
              </Link>
            </div>
          </section>
        )}

        {/* 4. Latest Releases Shelf */}
        <section className="space-y-4 pb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <span className="h-5 w-1 bg-purple-500 rounded-full" />
              Latest Uploads
            </h2>
            <Link 
              href="/browse?sort=newest"
              className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              See All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {latestContent.map((video) => (
              <ContentCard key={video.id} content={video} />
            ))}
          </div>
        </section>

      </main>

      {/* Shared Footer */}
      <footer className="w-full glass-panel border-t border-white/5 bg-[#09090b]/80 py-8 mt-auto z-10 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <p className="text-xs text-zinc-500 font-light leading-relaxed">
            &copy; {new Date().getFullYear()} Viral MMS Inc. All rights reserved. Ultra-HD adaptive video streaming demo with localized SQLite persistence.
          </p>
          <div className="flex items-center justify-center gap-6 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            <a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Support Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
