"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ContentCard from "@/components/ContentCard";
import Link from "next/link";
import {
  Sparkles, History, Bookmark, Download, Play,
  Trash2, User, Zap, ShieldCheck, Mail, Calendar, FileVideo, CheckCircle2
} from "lucide-react";
import { toggleSubscription } from "@/app/actions/auth";
import { toggleFavorite } from "@/app/actions/content";
import { createCashfreeOrder } from "@/app/actions/payment";
import { useRouter } from "next/navigation";

interface DashboardClientProps {
  user: {
    userId: string;
    name: string;
    email: string;
    subscription: string;
  };
  watchHistory: any[];
  favorites: any[];
  downloads: any[];
}

export default function DashboardClient({
  user,
  watchHistory,
  favorites,
  downloads
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"history" | "watchlist" | "downloads">("history");
  const [loading, setLoading] = useState(false);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);


  // Load Cashfree Web SDK Script dynamically on client-mount
  useEffect(() => {
    if (user.subscription === "premium") return;

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [user.subscription]);

  // Show a glowing confirmation banner if they just upgraded successfully
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("payment") === "success") {
        setShowUpgradeSuccess(true);
        // Clear query parameters from URL cleanly
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleToggleSub = async () => {
    if (user.subscription === "premium") {
      // Allow downgrading instantly for demo testing
      setLoading(true);
      const res = await toggleSubscription();
      if (res.success) {
        router.refresh();
      }
      setLoading(false);
      return;
    }

    // Otherwise, initiate Cashfree Checkout upgrade!
    setLoading(true);
    const res = await createCashfreeOrder();
    if (!res.success) {
      if ((res as any).isAuthError) {
        setShowAuthWarning(true);
        setLoading(false);
        return;
      }
      alert(res.error || "Failed to initiate payment. Please try again.");
      setLoading(false);
      return;
    }

    const { paymentSessionId, cfMode } = res;

    // Trigger Cashfree SDK Web Checkout
    try {
      if (typeof window !== "undefined" && (window as any).Cashfree) {
        const cashfree = (window as any).Cashfree({
          mode: cfMode // "sandbox" or "production"
        });

        cashfree.checkout({
          paymentSessionId,
          redirectTarget: "_modal" // opens inside interactive overlay modal
        });
      } else {
        alert("Payment gateway failed to initialize. Script loader delay. Please retry.");
      }
    } catch (e: any) {
      console.error("Cashfree Checkout error:", e);
      alert("An error occurred launching the checkout modal.");
    }
    setLoading(false);
  };

  const handleRemoveFavorite = async (id: string) => {
    await toggleFavorite(id);
    router.refresh();
  };

  // Convert bytes size to human readable sizes
  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Sum total downloaded space
  const totalDownloadsBytes = downloads.reduce((acc, current) => {
    const qualityBytes: Record<string, number> = {
      "720p": 503316480,
      "1080p": 1288490188,
      "4K": 4080218931
    };
    return acc + (qualityBytes[current.quality] || 1288490188);
  }, 0);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Shared Navbar */}
      <Navbar user={user} />

      {/* Main Panel */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Widescreen User Banner (Obsidian Glass) */}
        <section className="relative p-6 sm:p-8 rounded-3xl glass-panel bg-gradient-to-br from-zinc-950 via-[#121218] to-zinc-950 border border-white/5 shadow-2xl flex flex-col md:flex-row items-center md:items-start justify-between gap-6 overflow-hidden">

          <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/5 rounded-full blur-3xl z-0" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            {/* Huge Avatar */}
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-0.5 border border-white/10 shadow-lg shadow-purple-950/20">
              <div className="h-full w-full rounded-full bg-zinc-950 flex items-center justify-center font-black text-white text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Profile Info Details */}
            <div className="space-y-1.5 py-1">
              <h1 className="text-2xl font-black text-white tracking-wide">
                {user.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 text-xs text-zinc-400 font-light">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-zinc-500" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  Member since May 2026
                </span>
              </div>

              {/* VIP Status tag row */}
              <div className="pt-2 flex items-center justify-center md:justify-start gap-2">
                {user.subscription === "premium" ? (
                  <span className="flex items-center gap-1 px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-black text-purple-400 uppercase tracking-widest shadow-md">
                    <Sparkles className="h-3 w-3 fill-purple-400 animate-pulse" />
                    PREMIUM VIP MEMBER
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    STANDARD FREE ACCOUNT
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Upgrade CTA Interactive Action */}
          <div className="relative z-10 shrink-0 md:self-center flex flex-col items-center md:items-end">
            <button
              onClick={handleToggleSub}
              disabled={loading}
              className={`flex items-center gap-2 h-11 px-6 rounded-full font-bold text-xs shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] transform ${user.subscription === "premium"
                  ? "bg-zinc-900 border border-white/10 hover:border-red-500/40 text-red-400 hover:bg-red-500/5 hover:text-red-300 shadow-black/40"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-purple-950/30"
                }`}
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : user.subscription === "premium" ? (
                <>
                  <Zap className="h-4 w-4" />
                  Downgrade Membership
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 fill-white" />
                  Upgrade to Premium VIP
                </>
              )}
            </button>

          </div>

        </section>

        {/* Statistical Summary Panel */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Total Watch History", val: watchHistory.length, icon: History, color: "text-indigo-400" },
            { label: "Watchlist Favorites", val: favorites.length, icon: Bookmark, color: "text-purple-400" },
            { label: "Offline Vault Capacity", val: downloads.length === 0 ? "0 Files" : `${downloads.length} Videos (${formatBytes(totalDownloadsBytes)})`, icon: Download, color: "text-pink-400" }
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl glass-panel bg-[#121218]/30 border border-white/5 flex items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stat.label}</p>
                <p className="text-lg font-black text-white">{stat.val}</p>
              </div>
              <div className={`h-11 w-11 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </section>

        {/* Tab Controllers */}
        <section className="space-y-6">
          <div className="flex border-b border-white/5 gap-4">
            {[
              { id: "history", label: "Watch History", icon: History },
              { id: "watchlist", label: "My Watchlist", icon: Bookmark },
              { id: "downloads", label: "Downloads Vault", icon: Download }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 pb-3.5 px-1.5 text-sm font-bold border-b-2 transition-all duration-300 ${isActive
                      ? "border-purple-500 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Displays */}
          <div className="animate-in fade-in duration-300">

            {/* 1. History Tab */}
            {activeTab === "history" && (
              watchHistory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {watchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel border border-white/5 bg-[#121218]/25 p-3 hover:border-purple-500/30 transition-all duration-300"
                    >
                      {/* Thumbnail with progress */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 mb-3.5">
                        <img
                          src={item.content.thumbnail}
                          alt={item.content.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                          <Link
                            href={`/watch/${item.content.id}`}
                            className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-950/40 hover:scale-110 transition-transform"
                          >
                            <Play className="h-4 w-4 fill-white ml-0.5" />
                          </Link>
                        </div>
                        {/* Progress Bar slider */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Info details */}
                      <div className="px-1 text-left space-y-1.5">
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-[8px] font-semibold text-indigo-400">
                          {item.content.category}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-200 line-clamp-1 group-hover:text-purple-400 transition-colors">
                          {item.content.title}
                        </h4>
                        <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 font-semibold pt-1">
                          <span>{item.progress.toFixed(0)}% Completed</span>
                          <span>{new Date(item.lastWatched).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center rounded-3xl glass-panel bg-[#121218]/10 border border-white/5 space-y-3">
                  <History className="h-9 w-9 text-zinc-600 mx-auto" />
                  <h4 className="text-xs font-bold text-zinc-300">No watch history records</h4>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed font-light">
                    You haven't streamed any movies yet. Choose a premium film trailer on our homepage to start.
                  </p>
                </div>
              )
            )}

            {/* 2. Watchlist Tab */}
            {activeTab === "watchlist" && (
              favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {favorites.map((item) => (
                    <div key={item.id} className="relative group">
                      <ContentCard content={item.content} />
                      <button
                        onClick={() => handleRemoveFavorite(item.content.id)}
                        className="absolute bottom-4 right-4 z-20 p-2 rounded-lg bg-zinc-950/90 border border-white/5 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all duration-200"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center rounded-3xl glass-panel bg-[#121218]/10 border border-white/5 space-y-3">
                  <Bookmark className="h-9 w-9 text-zinc-600 mx-auto" />
                  <h4 className="text-xs font-bold text-zinc-300">Your Watchlist is empty</h4>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed font-light">
                    Add movies or clips to your private queue by clicking the "Add Watchlist" banner button.
                  </p>
                </div>
              )
            )}

            {/* 3. Downloads Tab */}
            {activeTab === "downloads" && (
              downloads.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
                  {downloads.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel border border-white/5 bg-[#121218]/25 p-3 hover:border-pink-500/30 transition-all duration-300"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 mb-3.5">
                        <img
                          src={item.content.thumbnail}
                          alt={item.content.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                          {/* Play locally */}
                          <Link
                            href={`/watch/${item.content.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 font-bold text-[10px] text-white shadow-lg"
                          >
                            <Play className="h-3 w-3 fill-white ml-0.5" />
                            Offline Stream
                          </Link>
                        </div>
                      </div>

                      {/* Info details */}
                      <div className="px-1 text-left space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-[8px] font-bold text-pink-400">
                            {item.quality} Quality
                          </span>
                          <span className="text-[10px] text-zinc-500 font-bold">
                            Offline Ready
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200 line-clamp-1 group-hover:text-pink-400 transition-colors">
                          {item.content.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center rounded-3xl glass-panel bg-[#121218]/10 border border-white/5 space-y-3">
                  <Download className="h-9 w-9 text-zinc-600 mx-auto" />
                  <h4 className="text-xs font-bold text-zinc-300">No offline downloads present</h4>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed font-light">
                    Need offline viewing? Launch any video trailer and click "Download Content" to transfer files to your local vault cache.
                  </p>
                </div>
              )
            )}

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-white/5 bg-[#09090b]/80 py-6 text-center text-xs text-zinc-600 mt-20">
        &copy; {new Date().getFullYear()} Viral MMS User Dashboard. VIP session management.
      </footer>

      {/* Cashfree Upgrade Success Glowing Overlay Modal */}
      {showUpgradeSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="relative w-full max-w-md p-8 rounded-3xl glass-panel bg-zinc-950/95 border-purple-500/35 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="h-16 w-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-lg shadow-purple-950/20">
              <CheckCircle2 className="h-9 w-9 text-purple-400 fill-purple-500/5 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-purple-400 font-black text-[10px] uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 fill-purple-400" />
                TRANSACTION CONFIRMED
              </div>
              <h3 className="text-xl font-black text-white leading-tight">
                Welcome to Premium VIP!
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[290px] mx-auto font-light">
                Your payment of <b>INR 199.00</b> via <b>Cashfree</b> was successfully authorized. Premium VIP status is active on your profile.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/15 text-[10px] text-purple-300 font-semibold leading-relaxed">
              🚀 Dynamic skip-intro togglers, unthrottled downloads capacity, and full 4K bitrate streaming channels are now unlocked in your cinema rooms.
            </div>

            <button
              onClick={() => setShowUpgradeSuccess(false)}
              className="w-full h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 font-bold text-xs text-white transition-all duration-300 shadow-lg shadow-purple-950/30 active:scale-95"
            >
              Enter the Cinema Rooms
            </button>
          </div>
        </div>
      )}
      {/* Cashfree API Credentials Warning Modal */}
      {showAuthWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg p-8 rounded-3xl glass-panel bg-zinc-950/95 border-amber-500/35 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 text-left">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
              <Zap className="h-6 w-6 text-amber-400 fill-amber-500/5 animate-pulse" />
            </div>

            <div className="space-y-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 font-black text-[10px] uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 fill-amber-400" />
                CASHFREE AUTHENTICATION FAILURE
              </div>
              <h3 className="text-xl font-black text-white leading-tight">
                Sandbox Credentials Inactive
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[380px] mx-auto font-light">
                The mock Cashfree App ID/Secret in your <code className="text-amber-400 bg-zinc-900 px-1 py-0.5 rounded">.env</code> file was rejected by Cashfree servers with <span className="font-semibold text-zinc-200">"authentication Failed"</span>.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-3">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide">
                  Configure Private Merchant Keys
                </h4>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">
                  Get your own active Sandbox API keys instantly from your Cashfree Dashboard (<a href="https://merchant.cashfree.com/merchant/pg/devices/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">merchant.cashfree.com</a>), update your keys in your <code className="text-zinc-300 bg-zinc-950 px-1 py-0.5 rounded text-[10px]">.env</code> file, and restart the dev server to start processing checkout sessions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowAuthWarning(false)}
                className="flex-1 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 font-bold text-xs text-zinc-400 transition-all active:scale-95 text-center"
              >
                Close & Review .env
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
