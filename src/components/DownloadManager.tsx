"use client";

import { useState, useEffect } from "react";
import { Download as DownloadIcon, X, CheckCircle, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { saveDownloadRecord } from "@/app/actions/content";
import { useRouter } from "next/navigation";

interface DownloadManagerProps {
  contentId: string;
  title: string;
  onClose: () => void;
}

export default function DownloadManager({ contentId, title, onClose }: DownloadManagerProps) {
  const router = useRouter();
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "completed">("idle");
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  // Quality details mappings
  const qualityDetails: Record<string, { size: string, bytes: number, timeEst: number }> = {
    "720p": { size: "480 MB", bytes: 503316480, timeEst: 8 },
    "1080p": { size: "1.2 GB", bytes: 1288490188, timeEst: 15 },
    "4K": { size: "3.8 GB", bytes: 4080218931, timeEst: 30 }
  };

  const handleStartDownload = () => {
    setDownloadState("downloading");
    setProgress(0);
    const details = qualityDetails[selectedQuality];
    setTotalBytes(details.bytes);
  };

  // Simulate progress counting
  useEffect(() => {
    if (downloadState !== "downloading") return;

    const details = qualityDetails[selectedQuality];
    const duration = details.timeEst * 1000; // ms
    const intervalMs = 150;
    const increment = (intervalMs / duration) * 100;

    const timer = setInterval(async () => {
      setProgress((prev) => {
        const next = prev + increment;
        
        // Calculate dynamic bytes downloaded
        const currentBytes = Math.min(Math.floor((next / 100) * details.bytes), details.bytes);
        setDownloadedBytes(currentBytes);

        // Generate dynamic speed (MB/s)
        const mockSpeed = +(35 + Math.random() * 45).toFixed(1); // 35 - 80 MB/s
        setSpeed(mockSpeed);

        if (next >= 100) {
          clearInterval(timer);
          // Complete download and save to DB
          saveDownloadRecord(contentId, selectedQuality).then((res) => {
            if (res.success) {
              router.refresh(); // Update dashboard download count
            }
          });
          setDownloadState("completed");
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [downloadState, selectedQuality, contentId]);

  const formatMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md p-6 rounded-3xl glass-panel bg-zinc-950/95 border-purple-500/20 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full border border-white/10 hover:border-purple-500/50 text-zinc-400 hover:text-white transition-all duration-200"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Dynamic States */}
        {downloadState === "idle" && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-purple-400 font-black text-[10px] uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5 fill-purple-400" />
                HIGH SPEED DOWNLOADS
              </div>
              <h2 className="text-lg font-black text-white leading-tight">
                Select Video Quality
              </h2>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                {title}
              </p>
            </div>

            {/* Quality pick items */}
            <div className="space-y-2.5">
              {[
                { key: "720p", label: "HD Quality (720p)", size: qualityDetails["720p"].size, badge: "FAST" },
                { key: "1080p", label: "Full HD Quality (1080p)", size: qualityDetails["1080p"].size, badge: "BEST VALUE" },
                { key: "4K", label: "Ultra-HD Cinematic (4K)", size: qualityDetails["4K"].size, badge: "VIP EXCLUSIVE" }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSelectedQuality(item.key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 ${
                    selectedQuality === item.key
                      ? "bg-purple-600/10 border-purple-500 text-white shadow-lg shadow-purple-950/20"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:border-white/20"
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Estimated size: {item.size}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                    selectedQuality === item.key 
                      ? "bg-purple-600 text-white" 
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Shield Indicator */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
              <ShieldCheck className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-indigo-300 leading-relaxed">
                Downloaded files are formatted in highly compressed premium MP4 files. Fully encrypted, secure, and ready for offline play in any video player.
              </p>
            </div>

            {/* Action buttons */}
            <button
              onClick={handleStartDownload}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 font-bold text-xs text-white shadow-lg shadow-purple-950/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
            >
              <DownloadIcon className="h-4 w-4" />
              Start High-Speed Download
            </button>
          </div>
        )}

        {downloadState === "downloading" && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-1">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto animate-bounce mb-3">
                <DownloadIcon className="h-5 w-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-white tracking-wider">
                DOWNLOADING WEB CONTENT
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium">
                {title} ({selectedQuality})
              </p>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300 px-1">
                <span>{progress.toFixed(0)}% Completed</span>
                <span className="text-purple-400 animate-pulse">{speed} MB/s</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-purple-600/30 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium px-1">
                <span>Downloaded: {formatMB(downloadedBytes)} MB</span>
                <span>Total: {qualityDetails[selectedQuality].size}</span>
              </div>
            </div>

            {/* Alert */}
            <div className="flex items-center gap-2 justify-center py-1.5 px-3 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Stable server connection confirmed
            </div>
          </div>
        )}

        {downloadState === "completed" && (
          <div className="space-y-5 text-center py-6">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/20">
              <CheckCircle className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white">
                Download Complete!
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[280px] mx-auto font-light">
                Premium <b>{selectedQuality}</b> video has been successfully formatted and saved to your device cache.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[10px] text-emerald-400 font-semibold max-w-[320px] mx-auto">
              Offline file is now accessible in your user dashboard under "Downloads".
            </div>

            <button
              onClick={onClose}
              className="h-10 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 font-bold text-xs text-white transition-all duration-300"
            >
              Back to Player
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
