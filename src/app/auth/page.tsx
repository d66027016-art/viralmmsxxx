import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
          <div className="h-10 w-10 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-4" />
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider animate-pulse text-glow">
            Accessing Gatekeepers...
          </p>
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
