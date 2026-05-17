"use client";

import { useState, useTransition } from "react";
import Navbar from "@/components/Navbar";
import { 
  Plus, Trash2, Eye, Heart, BarChart3, Film, Users, 
  Sparkles, ShieldCheck, Download, PlusCircle, CheckCircle, AlertTriangle 
} from "lucide-react";
import { uploadContent, deleteContent, createCategory, deleteCategory } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

interface AdminPanelClientProps {
  user: {
    userId: string;
    name: string;
    email: string;
    subscription: string;
  };
  analytics: {
    totalViews: number;
    totalLikes: number;
    totalContent: number;
    totalUsers: number;
    premiumUsers: number;
    totalFavorites: number;
    totalDownloads: number;
  };
  catalog: any[];
  categoriesList: any[];
}

export default function AdminPanelClient({ 
  user, 
  analytics, 
  catalog,
  categoriesList
}: AdminPanelClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form input states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categoriesList[0]?.name || "Sci-Fi");
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [qualities, setQualities] = useState("1080p,720p");

  // Dynamic Video Source Toggles
  const [videoSource, setVideoSource] = useState<"file" | "url">("file");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDragActive, setVideoDragActive] = useState(false);

  // Dynamic Thumbnail Source Toggles
  const [thumbSource, setThumbSource] = useState<"auto" | "file" | "url">("auto");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbDragActive, setThumbDragActive] = useState(false);

  // Auto Thumbnail generator states
  const [autoThumbnail, setAutoThumbnail] = useState<File | null>(null);
  const [autoThumbnailPreview, setAutoThumbnailPreview] = useState<string | null>(null);
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);

  // Category management states
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryPending, startCategoryTransition] = useTransition();
  const [catError, setCatError] = useState<string | null>(null);
  const [catSuccess, setCatSuccess] = useState<string | null>(null);

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("tags", tags);
    formData.append("duration", duration);
    formData.append("qualities", qualities);

    if (videoSource === "file") {
      if (!videoFile) {
        setFormError("Please select or drop a video file from your device.");
        return;
      }
      formData.append("videoFile", videoFile);
    } else {
      if (!videoUrl || videoUrl.trim() === "") {
        setFormError("Please enter a valid video stream URL.");
        return;
      }
      formData.append("videoUrl", videoUrl);
    }

    if (thumbSource === "auto") {
      if (!autoThumbnail) {
        setFormError("Auto-thumbnail is still generating or no video file is loaded yet.");
        return;
      }
      formData.append("thumbnailFile", autoThumbnail);
    } else if (thumbSource === "file") {
      if (!thumbFile) {
        setFormError("Please select or drop a custom thumbnail image.");
        return;
      }
      formData.append("thumbnailFile", thumbFile);
    } else {
      if (!thumbnail || thumbnail.trim() === "") {
        setFormError("Please enter a valid cover image URL.");
        return;
      }
      formData.append("thumbnail", thumbnail);
    }

    startTransition(async () => {
      const res = await uploadContent(null, formData);
      if (res.success) {
        setFormSuccess(res.message || "Video published successfully!");
        // Reset form inputs
        setTitle("");
        setDescription("");
        setTags("");
        setDuration("");
        setVideoUrl("");
        setThumbnail("");
        setVideoFile(null);
        setThumbFile(null);
        setAutoThumbnail(null);
        setAutoThumbnailPreview(null);
        router.refresh();
      } else {
        setFormError(res.error || "Failed to publish content.");
      }
    });
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you absolutely sure you want to remove this video from the catalog? This is destructive and permanent.")) {
      const res = await deleteContent(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete item.");
      }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCatError(null);
    setCatSuccess(null);

    const formData = new FormData();
    formData.append("name", newCategoryName);

    startCategoryTransition(async () => {
      const res = await createCategory(null, formData);
      if (res.success) {
        setCatSuccess(res.message || "Category created successfully!");
        setNewCategoryName("");
        router.refresh();
      } else {
        setCatError(res.error || "Failed to create category.");
      }
    });
  };

  const handleCategoryDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}"? Content currently tagged under "${name}" will not be deleted, but it will lose this category pill.`)) {
      const res = await deleteCategory(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete category.");
      }
    }
  };

  // Browser-based HTML5 canvas video frame capture
  const generateAutoThumbnail = (file: File) => {
    setIsGeneratingThumb(true);
    setAutoThumbnail(null);
    setAutoThumbnailPreview(null);

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      // Seek to 1.5s or halfway to get a non-black cinematic frame
      video.currentTime = Math.min(1.5, video.duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Generate base64 dataUrl for preview
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAutoThumbnailPreview(dataUrl);

          // Convert canvas frame to local File blob
          canvas.toBlob((blob) => {
            if (blob) {
              const autoFile = new File([blob], `thumb_${Date.now()}.jpg`, { type: "image/jpeg" });
              setAutoThumbnail(autoFile);
              // Set default selection to auto
              setThumbSource("auto");
            }
            setIsGeneratingThumb(false);
          }, "image/jpeg", 0.85);
        }
      } catch (err) {
        console.error("Auto-thumbnail extraction failed:", err);
        setIsGeneratingThumb(false);
      }
    };

    video.onerror = () => {
      console.error("Failed to load video metadata for auto-thumbnail.");
      setIsGeneratingThumb(false);
    };
  };

  // Video Drag & Drop Handlers
  const handleVideoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setVideoDragActive(true);
    } else if (e.type === "dragleave") {
      setVideoDragActive(false);
    }
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVideoDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
        generateAutoThumbnail(file);
      } else {
        alert("Please drop a valid video file (e.g. .mp4, .mov).");
      }
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      generateAutoThumbnail(file);
    }
  };

  // Thumbnail Drag & Drop Handlers
  const handleThumbDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setThumbDragActive(true);
    } else if (e.type === "dragleave") {
      setThumbDragActive(false);
    }
  };

  const handleThumbDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setThumbDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setThumbFile(file);
      } else {
        alert("Please drop a valid image file (e.g. .png, .jpg).");
      }
    }
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Shared Navbar */}
      <Navbar user={user} />

      {/* Main Admin Panel Dashboard */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Page title */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="space-y-1 text-left">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wide flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-red-500" />
              Administrative Command Board
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-light">
              Overview system performance metrics, manage catalog streams, and publish new cinematic trailers.
            </p>
          </div>
          <span className="px-3 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider">
            ADMIN SESSION SECURED
          </span>
        </div>

        {/* Analytics Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Aggregate Video Views", val: analytics.totalViews.toLocaleString(), icon: Eye, color: "text-purple-400" },
            { label: "Seeded Accounts", val: analytics.totalUsers, icon: Users, color: "text-indigo-400" },
            { label: "VIP Active Subscribers", val: analytics.premiumUsers, icon: Sparkles, color: "text-yellow-400" },
            { label: "Total Video Catalog", val: analytics.totalContent, icon: Film, color: "text-pink-400" }
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl glass-panel bg-[#121218]/30 border border-white/5 flex items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-tight">{stat.label}</p>
                <p className="text-base sm:text-xl font-black text-white">{stat.val}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-4.5 w-4.5" />
              </div>
            </div>
          ))}
        </section>

        {/* Two Columns: upload form on left, catalog manager list on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Upload Form (Takes 1 col on lg) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl glass-panel bg-zinc-900/10 border border-white/5 space-y-5">
              <h2 className="text-base font-black text-white tracking-wide flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-purple-400" />
                Publish Video Stream
              </h2>

              {/* Status notifications */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-400 text-center font-semibold animate-shake">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-400 text-center font-semibold flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Video Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sintel - Legendary Fantasy"
                    className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Movie Synopsis</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide cinematic details and summary..."
                    className="w-full min-h-[70px] p-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Category & Duration row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Genre Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Duration Length</label>
                    <input
                      type="text"
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 14m 48s"
                      className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Comma-separated tags</label>
                  <input
                    type="text"
                    required
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. fantasy, dragon, animation, 4k"
                    className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Video Stream Selector Block */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Video Stream Content</label>
                    <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-white/5">
                      <button
                        type="button"
                        onClick={() => setVideoSource("file")}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all ${
                          videoSource === "file" ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Local File
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoSource("url")}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all ${
                          videoSource === "url" ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Remote URL
                      </button>
                    </div>
                  </div>

                  {videoSource === "file" ? (
                    <div
                      onDragEnter={handleVideoDrag}
                      onDragOver={handleVideoDrag}
                      onDragLeave={handleVideoDrag}
                      onDrop={handleVideoDrop}
                      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed bg-zinc-950/40 text-center transition-all cursor-pointer ${
                        videoDragActive ? "border-purple-500 bg-purple-500/5" : "border-white/5 hover:border-purple-500/20"
                      }`}
                      onClick={() => document.getElementById("video-file-input")?.click()}
                    >
                      <input
                        id="video-file-input"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoChange}
                      />
                      
                      {videoFile ? (
                        <div className="space-y-1">
                          <CheckCircle className="h-7 w-7 text-emerald-400 mx-auto animate-pulse" />
                          <p className="text-xs font-bold text-zinc-200 line-clamp-1 max-w-[200px]">{videoFile.name}</p>
                          <p className="text-[10px] text-zinc-500 font-semibold">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <PlusCircle className="h-6 w-6 text-zinc-600 mx-auto" />
                          <p className="text-[11px] font-bold text-zinc-400">Drag & drop video, or click to browse</p>
                          <p className="text-[9px] text-zinc-600 font-medium">MP4, MOV, WEBM (up to 500MB)</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://domain.com/path/video.mp4"
                      className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-purple-300 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  )}
                </div>

                {/* Thumbnail Image Selector Block */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Thumbnail Cover Photo</label>
                    <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-white/5">
                      <button
                        type="button"
                        onClick={() => setThumbSource("auto")}
                        className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                          thumbSource === "auto" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Auto-Capture
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbSource("file")}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all ${
                          thumbSource === "file" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Local Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbSource("url")}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all ${
                          thumbSource === "url" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Remote URL
                      </button>
                    </div>
                  </div>

                  {thumbSource === "auto" ? (
                    <div className="relative flex flex-col items-center justify-center p-3 rounded-2xl border border-white/5 bg-zinc-950/40 text-center min-h-[120px]">
                      {isGeneratingThumb ? (
                        <div className="space-y-2">
                          <div className="h-6 w-6 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Capturing video frame...</p>
                        </div>
                      ) : autoThumbnailPreview ? (
                        <div className="relative group w-full max-w-[200px] aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg">
                          <img
                            src={autoThumbnailPreview}
                            alt="Auto Captured Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Frame Captured
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 p-4 text-center">
                          <AlertTriangle className="h-5 w-5 text-amber-500/80 mx-auto animate-bounce" />
                          <p className="text-[10px] text-zinc-400 font-bold">Select a local video file first</p>
                          <p className="text-[9px] text-zinc-600">The platform will capture a frame automatically!</p>
                        </div>
                      )}
                    </div>
                  ) : thumbSource === "file" ? (
                    <div
                      onDragEnter={handleThumbDrag}
                      onDragOver={handleThumbDrag}
                      onDragLeave={handleThumbDrag}
                      onDrop={handleThumbDrop}
                      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed bg-zinc-950/40 text-center transition-all cursor-pointer ${
                        thumbDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-white/5 hover:border-indigo-500/20"
                      }`}
                      onClick={() => document.getElementById("thumb-file-input")?.click()}
                    >
                      <input
                        id="thumb-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbChange}
                      />
                      
                      {thumbFile ? (
                        <div className="space-y-1">
                          <CheckCircle className="h-7 w-7 text-emerald-400 mx-auto animate-pulse" />
                          <p className="text-xs font-bold text-zinc-200 line-clamp-1 max-w-[200px]">{thumbFile.name}</p>
                          <p className="text-[10px] text-zinc-500 font-semibold">{(thumbFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <PlusCircle className="h-6 w-6 text-zinc-600 mx-auto" />
                          <p className="text-[11px] font-bold text-zinc-400">Drag & drop photo, or click to browse</p>
                          <p className="text-[9px] text-zinc-600 font-medium">PNG, JPG, WEBP (up to 15MB)</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/... or absolute path"
                      className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-indigo-300 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  )}
                </div>

                {/* Qualities */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Enabled Qualities (comma list)</label>
                  <input
                    type="text"
                    value={qualities}
                    onChange={(e) => setQualities(e.target.value)}
                    placeholder="1080p,720p"
                    className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 font-bold text-xs text-white shadow-lg active:scale-95 transition-all duration-300 disabled:opacity-50"
                >
                  {isPending ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    "Publish Content"
                  )}
                </button>
              </form>
            </div>

            {/* Manage Genre Categories Box */}
            <div className="p-6 rounded-3xl glass-panel bg-zinc-900/10 border border-white/5 space-y-5">
              <h2 className="text-base font-black text-white tracking-wide flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-indigo-400" />
                Manage Genre Categories
              </h2>

              {/* Status notifications */}
              {catError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-400 text-center font-semibold animate-shake">
                  {catError}
                </div>
              )}
              {catSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-400 text-center font-semibold flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  {catSuccess}
                </div>
              )}

              {/* Category creation form */}
              <form onSubmit={handleCategorySubmit} className="space-y-3">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">New Category Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Romance"
                      className="flex-grow h-9 px-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={categoryPending}
                      className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-md active:scale-95 transition-all"
                    >
                      {categoryPending ? (
                        <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      ) : (
                        "Create"
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Categories list with delete button */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block mb-1">Active Categories</label>
                {categoriesList.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-white/5 text-xs text-zinc-200 hover:border-indigo-500/20 transition-all"
                  >
                    <span className="font-semibold">{cat.name}</span>
                    <button
                      onClick={() => handleCategoryDelete(cat.id, cat.name)}
                      className="p-1 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                      title={`Delete category "${cat.name}"`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Catalog Grid & Stats (Takes 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl glass-panel bg-zinc-900/10 border border-white/5 space-y-5">
              <h2 className="text-base font-black text-white tracking-wide flex items-center gap-1.5">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Active Video Catalog ({catalog.length})
              </h2>

              {/* Video List catalog Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-zinc-950/40">
                <table className="w-full border-collapse text-left text-xs text-zinc-300">
                  <thead className="bg-[#121218]/80 text-zinc-400 font-bold uppercase tracking-wider text-[9px] border-b border-white/5">
                    <tr>
                      <th className="p-4">Cover & Title</th>
                      <th className="p-4">Genre</th>
                      <th className="p-4 text-center">Views</th>
                      <th className="p-4 text-center">Likes</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {catalog.map((video) => (
                      <tr key={video.id} className="hover:bg-white/5 transition-colors">
                        
                        {/* Cover and details */}
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-10 w-16 object-cover rounded-lg border border-white/10 shrink-0 bg-zinc-900"
                          />
                          <div className="min-w-0 max-w-[200px] sm:max-w-[280px]">
                            <p className="font-bold text-zinc-200 truncate leading-snug">{video.title}</p>
                            <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">{video.duration} duration</p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-[9px] font-bold text-indigo-400">
                            {video.category}
                          </span>
                        </td>

                        {/* Views */}
                        <td className="p-4 text-center font-semibold text-zinc-300">
                          {video.views.toLocaleString()}
                        </td>

                        {/* Likes */}
                        <td className="p-4 text-center font-semibold text-zinc-300">
                          {video.likes.toLocaleString()}
                        </td>

                        {/* Delete action */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteItem(video.id)}
                            className="p-1.5 rounded-lg border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete video record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No items catalog fallback */}
              {catalog.length === 0 && (
                <div className="text-center py-10 space-y-2">
                  <AlertTriangle className="h-7 w-7 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-500 font-bold">Catalog is completely empty.</p>
                </div>
              )}

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-white/5 bg-[#09090b]/80 py-6 text-center text-xs text-zinc-600 mt-20">
        &copy; {new Date().getFullYear()} Viral MMS Administrative Board. Command level authentication.
      </footer>
    </div>
  );
}
