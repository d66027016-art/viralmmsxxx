"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Film, Mail, Lock, User as UserIcon, Sparkles, ShieldCheck, Star } from "lucide-react";
import { loginUser, registerUser } from "@/app/actions/auth";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = async (formData: FormData) => {
    setError(null);

    startTransition(async () => {
      let res;
      if (mode === "login") {
        res = await loginUser(null, formData);
      } else {
        res = await registerUser(null, formData);
      }

      if (res.success) {
        // Force refresh all layouts and navbars
        router.refresh();
        router.push(callbackUrl);
      } else {
        setError(res.error || "An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col md:flex-row select-none w-full">

      {/* Left side: Premium Cinematic Branding Graphic (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 bg-zinc-950 overflow-hidden border-r border-white/5">
        <div className="absolute top-0 right-0 h-96 w-96 bg-purple-500/5 rounded-full blur-3xl z-0" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <Film className="h-6 w-6 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          <span className="bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-lg font-black tracking-wider text-transparent">
            VIRAL <span className="text-white">MMS</span>
          </span>
        </div>

        {/* Cinematic content taglines */}
        <div className="relative z-10 space-y-6 max-w-md">
          <span className="flex items-center gap-1 text-[10px] font-black tracking-widest text-purple-400 uppercase">
            <Sparkles className="h-3.5 w-3.5 fill-purple-400" />
            ENTER THE CINEMA VAULT
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
            Ultra-HD Web streaming starts here.
          </h1>
          <p className="text-sm text-zinc-400 font-light leading-relaxed">
            Create an account to browse high-speed adaptive media catalog, customize watchlist cards, track watch history and download files locally for offline plays.
          </p>
        </div>

        {/* Feature stats */}
        <div className="relative z-10 grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Stream quality</p>
            <p className="text-sm font-black text-white mt-0.5 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              1080p / 4K UHD
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Account Access</p>
            <p className="text-sm font-black text-white mt-0.5 flex items-center gap-1">
              <Star className="h-4 w-4 text-purple-400 fill-purple-400" />
              Free & VIP Tiers
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Responsive Interactive Glass Auth Card */}
      <div className="flex-grow flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel bg-zinc-950/80 border-purple-500/10 shadow-2xl space-y-6 animate-in zoom-in-95 duration-500">

          {/* Form Header */}
          <div className="space-y-1 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-tight">
              {mode === "login" ? "Welcome Back VIP" : "Create Private Account"}
            </h2>
          </div>

          {/* Form Error Logs */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 text-center font-semibold animate-shake">
              {error}
            </div>
          )}



                {/* Credentials Inputs form */}
                <form action={handleAction} className="space-y-4">

                  {/* Name Input (Register mode only) */}
                  {mode === "register" && (
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Full Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="Enter your name"
                          className="w-full h-10 px-4 pl-10 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        />
                        <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Secure Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="name@domain.com"
                        className="w-full h-10 px-4 pl-10 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      />
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        className="w-full h-10 px-4 pl-10 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      />
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 h-10.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 font-bold text-xs text-white shadow-lg shadow-purple-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50"
                  >
                    {isPending ? (
                      <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : mode === "login" ? (
                      "Entre in World"
                    ) : (
                      "Register Cinema Pass"
                    )}
                  </button>
                </form>

                {/* Toggle modes */}
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setMode(mode === "login" ? "register" : "login");
                      setError(null);
                    }}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                  >
                    {mode === "login"
                      ? "Don't have a VIP pass? Register here"
                      : "Already hold a cinema pass? Log in here"}
                  </button>
                </div>

            </div>
      </div>

      </div>
      );
}
