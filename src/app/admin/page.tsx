import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { getAnalytics } from "@/app/actions/admin";
import AdminPanelClient from "@/components/AdminPanelClient";

export const revalidate = 0; // Disable static caching to support dynamic updates on seed or custom uploads

export default async function AdminPage() {
  const user = await getCurrentUser();

  // Enforce administrative access limits (Only allow admin@hotwebhd.com to view administrative boards)
  if (!user) {
    redirect("/api/auth/clear?callbackUrl=/admin");
  }

  if (user.email !== "admin@hotwebhd.com") {
    redirect("/");
  }

  try {
    // 1. Fetch system metrics aggregates
    const analyticsRes = await getAnalytics();
    let analytics = {
      totalViews: 0,
      totalLikes: 0,
      totalContent: 0,
      totalUsers: 0,
      premiumUsers: 0,
      totalFavorites: 0,
      totalDownloads: 0,
    };

    if (analyticsRes.success && analyticsRes.data) {
      analytics = analyticsRes.data;
    }

    // 2. Fetch full catalog list
    const catalog = await prisma.content.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch categories list dynamically from database
    const categoriesList = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return (
      <AdminPanelClient
        user={user}
        analytics={analytics}
        catalog={catalog}
        categoriesList={categoriesList}
      />
    );
  } catch (error: any) {
    console.error("Admin Page render error:", error);
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Admin Command Board failed to load</h1>
        <p className="text-sm text-zinc-400 max-w-sm font-light leading-relaxed">
          The database queries failed or returned an error. This is usually due to database schema syncing issues.
        </p>
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-2xl text-left text-xs font-mono text-red-400 max-w-xl overflow-x-auto whitespace-pre-wrap leading-normal shadow-lg">
          <strong>Error Message:</strong> {error.message || String(error)}
          {error.stack && `\n\nStack Trace:\n${error.stack}`}
        </div>
        <a href="/" className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition-all">
          Go Back Home
        </a>
      </div>
    );
  }
}
