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
}
