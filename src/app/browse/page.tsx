import { getCurrentUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import ContentCard from "@/components/ContentCard";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown, RefreshCw, StarOff } from "lucide-react";

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
}

export const revalidate = 0; // Disable static caching to allow instant updates from seed/actions

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const user = await getCurrentUser();
  
  // Resolve searchParams promise in Next.js 15
  const params = await searchParams;
  const query = params.q || "";
  const activeCategory = params.category || "All";
  const sortBy = params.sort || "newest";

  // Build the database query dynamically
  const whereClause: any = {};

  if (activeCategory !== "All") {
    whereClause.category = activeCategory;
  }

  if (query) {
    whereClause.OR = [
      { title: { contains: query } },
      { description: { contains: query } },
      { tags: { contains: query } },
      { category: { contains: query } },
    ];
  }

  // Determine sorting order
  let orderByClause: any = { createdAt: "desc" };
  if (sortBy === "popular") {
    orderByClause = { views: "desc" };
  } else if (sortBy === "likes") {
    orderByClause = { likes: "desc" };
  } else if (sortBy === "oldest") {
    orderByClause = { createdAt: "asc" };
  }

  // Fetch from Prisma SQLite
  const matchingContent = await prisma.content.findMany({
    where: whereClause,
    orderBy: orderByClause,
  });

  // Dynamic list of categories from the database
  const dbCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  const categories = ["All", ...dbCategories.map(c => c.name)];

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Shared Navbar */}
      <Navbar user={user} />

      {/* Main Browse Panel */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wide">
            Explore Premium Catalog
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light">
            Filter through high-definition content, series, clips, and commercial streams.
          </p>
        </div>

        {/* Filter Toolbar (Glassmorphic) */}
        <section className="p-4 rounded-2xl glass-panel bg-zinc-900/20 border border-white/5 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Bar */}
            <form action="/browse" method="GET" className="relative w-full md:max-w-md">
              {activeCategory !== "All" && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
              {sortBy !== "newest" && (
                <input type="hidden" name="sort" value={sortBy} />
              )}
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search movies, descriptors, or tags..."
                className="w-full h-10 px-4 pl-10 rounded-xl bg-zinc-950/80 border border-white/5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            </form>

            {/* Sorter Selector */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mr-2">Sort By:</span>
              
              <div className="flex bg-zinc-950/80 rounded-xl border border-white/5 p-1 gap-1">
                {[
                  { label: "Newest", value: "newest" },
                  { label: "Popular", value: "popular" },
                  { label: "Likes", value: "likes" }
                ].map((item) => {
                  const isActive = sortBy === item.value;
                  // Construct URL manually
                  const searchParamsString = new URLSearchParams();
                  if (query) searchParamsString.set("q", query);
                  if (activeCategory !== "All") searchParamsString.set("category", activeCategory);
                  searchParamsString.set("sort", item.value);

                  return (
                    <Link
                      key={item.value}
                      href={`/browse?${searchParamsString.toString()}`}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-200 ${
                        isActive
                          ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Category Pill Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              // Construct URL manually
              const searchParamsString = new URLSearchParams();
              if (query) searchParamsString.set("q", query);
              searchParamsString.set("category", cat);
              if (sortBy !== "newest") searchParamsString.set("sort", sortBy);

              return (
                <Link
                  key={cat}
                  href={`/browse?${searchParamsString.toString()}`}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-950/30 border border-purple-400/25"
                      : "bg-zinc-950/50 border border-white/5 text-zinc-400 hover:text-white hover:border-white/10"
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>

        </section>

        {/* Results Info Bar */}
        <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold px-1">
          <span>Found {matchingContent.length} matching premium videos</span>
          {(query || activeCategory !== "All" || sortBy !== "newest") && (
            <Link 
              href="/browse"
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Filters
            </Link>
          )}
        </div>

        {/* Grid display */}
        {matchingContent.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {matchingContent.map((video) => (
              <ContentCard key={video.id} content={video} />
            ))}
          </section>
        ) : (
          <section className="py-20 text-center rounded-3xl glass-panel bg-zinc-950/30 border border-white/5 space-y-3">
            <StarOff className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-300">
              No matching content found
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto font-light leading-relaxed">
              We couldn't find anything matching your search filters. Try refining your keyword search or selecting another category pill.
            </p>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-white/5 bg-[#09090b]/80 py-6 text-center z-10 text-xs text-zinc-600 mt-20">
        &copy; {new Date().getFullYear()} Viral MMS Inc. Premium video searching demo.
      </footer>
    </div>
  );
}
