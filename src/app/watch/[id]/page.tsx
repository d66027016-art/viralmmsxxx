import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import WatchPageClient from "@/components/WatchPageClient";

interface WatchPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 0; // Disable static cache to allow instant updates from history/seed

export default async function WatchPage({ params }: WatchPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // 1. Fetch content metadata
  const content = await prisma.content.findUnique({
    where: { id },
  });

  if (!content) {
    notFound();
  }

  // 2. Fetch logged in user
  const user = await getCurrentUser();

  // 3. Fetch watch progress (if user is authenticated)
  let initialProgress = 0;
  if (user) {
    const history = await prisma.watchHistory.findUnique({
      where: {
        userId_contentId: {
          userId: user.userId,
          contentId: id,
        },
      },
    });
    if (history) {
      initialProgress = history.progress;
    }
  }

  // 4. Fetch up next recommendations list (excluding current item)
  const recommendations = await prisma.content.findMany({
    where: {
      id: { not: id },
    },
    take: 4,
    orderBy: { views: "desc" },
  });

  // Automatically increment views on load
  await prisma.content.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  return (
    <WatchPageClient
      user={user}
      content={content}
      initialProgress={initialProgress}
      recommendations={recommendations}
    />
  );
}
