import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const revalidate = 0; // Disable static cache to allow instant updates from state/seeding/clicks

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/api/auth/clear?callbackUrl=/dashboard");
  }

  // 1. Fetch user watch history records
  const watchHistory = await prisma.watchHistory.findMany({
    where: { userId: user.userId },
    include: { content: true },
    orderBy: { lastWatched: "desc" },
  });

  // 2. Fetch user favorite watchlist records
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.userId },
    include: { content: true },
  });

  // 3. Fetch user download records
  const downloads = await prisma.download.findMany({
    where: { userId: user.userId },
    include: { content: true },
  });

  return (
    <DashboardClient
      user={user}
      watchHistory={watchHistory}
      favorites={favorites}
      downloads={downloads}
    />
  );
}
