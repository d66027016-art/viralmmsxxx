"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle, XCircle } from "lucide-react";

export default function AgeGate() {
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    // Check if the user has already verified their age in this browser session
    const isVerified = localStorage.getItem("ageGateVerified");
    if (isVerified !== "true") {
      setShowGate(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("ageGateVerified", "true");
    setShowGate(false);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  if (!showGate) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4 animate-fade-in">
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-[#09090b]/80 shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center space-y-6">
        
        {/* Red Shield Alert Icon */}
        <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="h-8 w-8 animate-pulse" />
        </div>

        {/* Mature warning headers */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            18+ Age Verification
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
            This portal contains mature content and cinematic streams intended only for audiences aged 18 and older.
          </p>
        </div>

        {/* Bullet points for legal compliance & trust */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 text-left space-y-2.5">
          <div className="flex items-start gap-2.5 text-xs text-zinc-500 font-light">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>I confirm that I am at least 18 years of age or the legal age of majority in my jurisdiction.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-500 font-light">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>I agree to keep my credentials private and secure from minors under the legal age.</span>
          </div>
        </div>

        {/* Actions grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleExit}
            className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/5 font-bold text-xs text-zinc-400 transition-all hover:text-white"
          >
            <XCircle className="h-4 w-4" />
            Exit Portal
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 font-bold text-xs text-white shadow-lg shadow-red-500/10 active:scale-95 transition-all duration-300"
          >
            I am 18+ Enter
          </button>
        </div>

        {/* Small footer text */}
        <p className="text-[10px] text-zinc-600 font-medium">
          Viral MMS &copy; {new Date().getFullYear()} Mature Entertainment. All rights reserved.
        </p>

      </div>
    </div>
  );
}
