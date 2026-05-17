"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Film, User, LogOut, ShieldAlert, Sparkles, Menu, X } from "lucide-react";
import { logoutUser } from "@/app/actions/auth";

interface NavbarProps {
  user: {
    userId: string;
    name: string;
    email: string;
    subscription: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/browse");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.refresh();
    router.push("/auth");
  };

  // Close dropdowns on route change
  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Browse & Search", href: "/browse" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 bg-[#09090b]/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <Film className="h-6 w-6 text-purple-500 group-hover:text-indigo-400 transition-colors duration-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-xl font-black tracking-wider text-transparent group-hover:from-indigo-300 group-hover:to-pink-400 transition-all duration-300">
                VIRAL <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">MMS</span>
              </span>
            </Link>
          </div>

          {/* Search Form (Desktop) */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="hidden md:flex relative max-w-md w-full"
          >
            <input
              type="text"
              placeholder="Search premium videos, tags, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 pl-10 rounded-full bg-zinc-900/50 border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          </form>

          {/* Navigation Links & User Controls (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-all duration-300 hover:text-white ${
                    isActive 
                      ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" 
                      : "text-zinc-400"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Admin Dashboard link */}
            {user?.email === "admin@hotwebhd.com" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1 text-sm font-medium transition-all duration-300 hover:text-red-400 ${
                  pathname === "/admin" 
                    ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" 
                    : "text-zinc-400"
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                Admin Panel
              </Link>
            )}

            {/* User details or login button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full bg-zinc-900/80 border border-white/10 hover:border-purple-500/50 transition-all duration-300"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-zinc-300 font-medium max-w-[100px] truncate hidden lg:block">
                    {user.name}
                  </span>
                  
                  {/* Status Badge */}
                  {user.subscription === "premium" ? (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-400">
                      <Sparkles className="h-2.5 w-2.5" />
                      VIP
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[10px] font-medium text-zinc-400">
                      Free
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-950 border border-white/10 p-1 shadow-xl shadow-black/80 backdrop-blur-xl animate-in fade-in-50 slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-all duration-200"
                    >
                      <User className="h-3.5 w-3.5 text-purple-400" />
                      My Dashboard
                    </Link>
                    {user.email === "admin@hotwebhd.com" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-all duration-200"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                        Admin Control
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold text-xs text-white shadow-md shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[9px] font-bold text-purple-400">
                VIP
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-white/10 hover:border-purple-500/50 text-zinc-400 hover:text-white transition-all duration-300"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-white/5 bg-[#09090b]/95 p-4 space-y-4 animate-in slide-in-from-top duration-300">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search premium videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-4 pl-9 rounded-full bg-zinc-900/80 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          </form>

          {/* Mobile Nav Links */}
          <div className="flex flex-col gap-2.5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 ${
                  pathname === link.href ? "text-purple-400" : "text-zinc-400"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {user?.email === "admin@hotwebhd.com" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-white/5 text-red-400 transition-all duration-200"
              >
                <ShieldAlert className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
          </div>

          <div className="border-t border-white/5 pt-3">
            {user ? (
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{user.name}</p>
                    <p className="text-[10px] text-zinc-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="flex w-full justify-center items-center h-9 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold text-xs text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
