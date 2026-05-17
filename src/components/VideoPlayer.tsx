"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, 
  Settings, SkipForward, HelpCircle, FastForward, Minimize, Airplay
} from "lucide-react";
import { updateWatchProgress } from "@/app/actions/content";

interface VideoPlayerProps {
  contentId: string;
  videoUrl: string;
  title: string;
  initialProgress?: number; // percentage (0 to 100)
  onNext?: () => void; // callback when auto-next triggers
}

export default function VideoPlayer({ 
  contentId, 
  videoUrl, 
  title, 
  initialProgress = 0,
  onNext 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // UI state variables
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // Premium Features
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showAutoNext, setShowAutoNext] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState(8);
  const [isResumed, setIsResumed] = useState(false);

  // Active controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset controls timer
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }
    }, 3000);
  };

  // Setup/tear down mouse movement listeners for control bars
  useEffect(() => {
    const handleMouseMove = () => resetControlsTimer();
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
    }
    resetControlsTimer();
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Handle auto-resume and keyboard listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      
      // Auto-resume from initial progress if available
      if (initialProgress > 0 && initialProgress < 98 && !isResumed) {
        const seekTime = (initialProgress / 100) * video.duration;
        video.currentTime = seekTime;
        setIsResumed(true);
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard in form fields
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "KeyM":
          toggleMute();
          break;
        case "KeyF":
          toggleFullscreen();
          break;
        case "ArrowRight":
          seekForward();
          break;
        case "ArrowLeft":
          seekBackward();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [initialProgress, isResumed]);

  // Progress Logging Timer (saves progress in SQLite database every 5 seconds)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.duration === 0) return;

      const progressPercent = (video.currentTime / video.duration) * 100;
      await updateWatchProgress(contentId, progressPercent);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, contentId]);

  // Handle dynamic events during playback
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    // Dynamic PREMIUM Features Check:
    // 1. SKIP INTRO (Show between 5s and 30s, only for items longer than 90s)
    if (video.duration > 90 && video.currentTime >= 5 && video.currentTime <= 30) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }

    // 2. AUTO NEXT EPISODE countdown (Show 10s before ending, only for items longer than 30s)
    if (video.duration > 30 && video.duration - video.currentTime <= 10) {
      setShowAutoNext(true);
    } else {
      setShowAutoNext(false);
    }
  };

  // Countdown timer for next video auto-play
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAutoNext && autoNextCountdown > 0) {
      timer = setTimeout(() => {
        setAutoNextCountdown(prev => prev - 1);
      }, 1000);
    } else if (showAutoNext && autoNextCountdown === 0) {
      triggerNext();
    }
    return () => clearTimeout(timer);
  }, [showAutoNext, autoNextCountdown]);

  const triggerNext = () => {
    setShowAutoNext(false);
    if (onNext) {
      onNext();
    } else {
      // Loop or restart if no next video hook is loaded
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  // Basic player commands
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
    resetControlsTimer();
  };

  const handlePlayState = () => setIsPlaying(true);
  const handlePauseState = () => setIsPlaying(false);

  const seekForward = () => {
    if (videoRef.current) videoRef.current.currentTime += 10;
  };

  const seekBackward = () => {
    if (videoRef.current) videoRef.current.currentTime -= 10;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = volume > 0 ? volume : 0.8;
      setIsMuted(false);
      if (volume === 0) setVolume(0.8);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);
    // Simulate high-fidelity buffering/transition
    setIsSeeking(true);
    setTimeout(() => {
      setIsSeeking(false);
    }, 800);
  };

  const handleSkipIntro = () => {
    if (videoRef.current) {
      // Seek to 90s (skips dynamic opening sequence)
      videoRef.current.currentTime = Math.min(90, duration - 10);
      setShowSkipIntro(false);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Track manual fullscreen change triggers
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl group border border-white/5 select-none"
    >
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        onClick={togglePlay}
        onPlay={handlePlayState}
        onPause={handlePauseState}
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-contain cursor-pointer"
        preload="auto"
      />

      {/* Buffering Shimmer Overlay */}
      {isSeeking && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="h-12 w-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-3" />
          <p className="text-sm font-semibold text-purple-400 tracking-wider text-glow animate-pulse">
            ADAPTING HD BITRATE...
          </p>
        </div>
      )}

      {/* Custom Premium Features Overlay */}
      {/* 1. Skip Intro Button */}
      {showSkipIntro && (
        <button
          onClick={handleSkipIntro}
          className="absolute bottom-20 left-6 z-25 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-950/90 border border-purple-500/35 hover:border-purple-400 font-bold text-xs text-white shadow-xl shadow-purple-950/20 active:scale-95 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 duration-500"
        >
          <SkipForward className="h-4 w-4 text-purple-400 animate-pulse" />
          SKIP INTRO
        </button>
      )}

      {/* 2. Auto Play Next Episode Overlay */}
      {showAutoNext && (
        <div className="absolute top-6 right-6 z-25 flex flex-col p-4 rounded-2xl glass-panel bg-zinc-950/90 border-purple-500/25 max-w-[240px] shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">UP NEXT</p>
          <p className="text-xs font-semibold text-white truncate mb-3">{title}</p>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={triggerNext}
              className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white active:scale-95 transition-all duration-300"
            >
              Play Now
            </button>
            <button
              onClick={() => setShowAutoNext(false)}
              className="h-8 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-400"
            >
              Cancel ({autoNextCountdown}s)
            </button>
          </div>
        </div>
      )}

      <div 
        onClick={togglePlay}
        className={`absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-t from-black/85 via-transparent to-black/40 transition-opacity duration-500 cursor-pointer ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Header (Top info bar) */}
        <div onClick={(e) => e.stopPropagation()} className="p-5 flex items-center justify-between cursor-default">
          <h2 className="text-sm font-semibold text-white truncate drop-shadow-md">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-600/35 border border-purple-500/30 text-[10px] font-black text-purple-400 tracking-wider">
              {selectedQuality} ULTRA-HD
            </span>
          </div>
        </div>

        {/* Center Big Play Button (shows only when paused) */}
        {!isPlaying && (
          <button 
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-purple-600/90 border border-purple-400/20 hover:bg-purple-500 flex items-center justify-center text-white shadow-2xl scale-100 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <Play className="h-6 w-6 fill-white ml-1" />
          </button>
        )}

        {/* Control Sliders & Bars (Bottom) */}
        <div onClick={(e) => e.stopPropagation()} className="p-5 space-y-3.5 cursor-default">
          {/* Progress Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-300 w-10">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={duration > 0 ? (currentTime / duration) * 100 : 0}
              onChange={handleProgressChange}
              className="w-full h-1.5 rounded-full cursor-pointer accent-purple-500"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.15) ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.15) 100%)`
              }}
            />
            <span className="text-xs font-medium text-zinc-300 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4.5">
              {/* Play/Pause */}
              <button 
                onClick={togglePlay}
                className="text-zinc-200 hover:text-purple-400 transition-colors duration-300"
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              </button>

              {/* 10s Rewind */}
              <button 
                onClick={seekBackward}
                className="text-zinc-400 hover:text-white transition-colors duration-300"
                title="Rewind 10s"
              >
                <RotateCcw className="h-4.5 w-4.5" />
              </button>

              {/* 10s Forward */}
              <button 
                onClick={seekForward}
                className="text-zinc-400 hover:text-white transition-colors duration-300"
                title="Forward 10s"
              >
                <FastForward className="h-4.5 w-4.5" />
              </button>

              {/* Volume Controller */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMute}
                  className="text-zinc-200 hover:text-purple-400 transition-colors duration-300"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1.5 rounded-full cursor-pointer accent-purple-500 bg-zinc-700 transition-all duration-300"
                />
              </div>
            </div>

            {/* Menu options & Fullscreen controls */}
            <div className="flex items-center gap-4 relative">
              
              {/* Speed Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowQualityMenu(false);
                  }}
                  className="flex items-center gap-1 text-xs text-zinc-300 hover:text-purple-400 font-semibold px-2 py-1 rounded bg-white/5 border border-white/5 transition-all duration-300"
                >
                  {playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`}
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-9 right-0 w-24 rounded-lg bg-zinc-950 border border-white/10 p-1 shadow-2xl flex flex-col z-35 animate-in fade-in duration-200">
                    {[0.5, 1, 1.25, 1.5, 2].map((sp) => (
                      <button
                        key={sp}
                        onClick={() => handleSpeedChange(sp)}
                        className={`text-left px-2.5 py-1.5 rounded text-[10px] font-semibold text-zinc-300 hover:bg-purple-600 hover:text-white ${
                          playbackSpeed === sp ? "text-purple-400 bg-white/5" : ""
                        }`}
                      >
                        {sp === 1 ? "Normal" : `${sp}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowSpeedMenu(false);
                  }}
                  className="flex items-center gap-1 text-xs text-zinc-300 hover:text-purple-400 font-semibold px-2 py-1 rounded bg-white/5 border border-white/5 transition-all duration-300"
                >
                  <Settings className="h-3.5 w-3.5" />
                  {selectedQuality}
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-9 right-0 w-24 rounded-lg bg-zinc-950 border border-white/10 p-1 shadow-2xl flex flex-col z-35 animate-in fade-in duration-200">
                    {["1080p", "720p"].map((ql) => (
                      <button
                        key={ql}
                        onClick={() => handleQualityChange(ql)}
                        className={`text-left px-2.5 py-1.5 rounded text-[10px] font-semibold text-zinc-300 hover:bg-purple-600 hover:text-white ${
                          selectedQuality === ql ? "text-purple-400 bg-white/5" : ""
                        }`}
                      >
                        {ql}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle Fullscreen */}
              <button 
                onClick={toggleFullscreen}
                className="text-zinc-200 hover:text-purple-400 transition-colors duration-300"
                title="Fullscreen"
              >
                <Maximize className="h-5 w-5" />
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
