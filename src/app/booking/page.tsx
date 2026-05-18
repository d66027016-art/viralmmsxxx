import { getCurrentUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import BookingClient from "@/components/BookingClient";

export const revalidate = 0; // Disable static cache to reflect instant booking availability and new models

export default async function BookingPage() {
  const user = await getCurrentUser();

  // Fetch all available girls from Prisma PostgreSQL
  const girls = await prisma.girl.findMany({
    where: { available: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <BookingClient 
      user={user} 
      initialGirls={girls} 
    />
  );
}
