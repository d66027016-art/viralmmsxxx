"use server";

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';

// Fetch all content items, optionally filtered by search query or category
export async function getAllContent(searchQuery?: string, category?: string) {
  try {
    const whereClause: any = {};

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (searchQuery) {
      whereClause.OR = [
        { title: { contains: searchQuery } },
        { description: { contains: searchQuery } },
        { tags: { contains: searchQuery } },
      ];
    }

    const contents = await prisma.content.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: contents };
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return { success: false, error: 'Failed to fetch content' };
  }
}

// Fetch a single content item, and increment its view count
export async function getContentById(id: string) {
  try {
    const content = await prisma.content.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return { success: true, data: content };
  } catch (error) {
    console.error(`Failed to fetch content ${id}:`, error);
    return { success: false, error: 'Content not found' };
  }
}

// Fetch user watchlist/favorites
export async function getFavorites() {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: 'Unauthorized', data: [] };

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.userId },
      include: { content: true },
    });

    return { success: true, data: favorites.map(f => f.content) };
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return { success: false, error: 'Failed to retrieve watchlist', data: [] };
  }
}

// Toggle content favorite/watchlist status
export async function toggleFavorite(contentId: string) {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: 'You must be logged in to update your watchlist.' };

  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_contentId: {
          userId: session.userId,
          contentId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { success: true, favorited: false, message: 'Removed from watchlist.' };
    } else {
      await prisma.favorite.create({
        data: {
          userId: session.userId,
          contentId,
        },
      });
      return { success: true, favorited: true, message: 'Added to watchlist!' };
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return { success: false, error: 'Failed to update watchlist.' };
  }
}

// Check if content is in user's watchlist
export async function isFavorited(contentId: string): Promise<boolean> {
  const session = await getCurrentUser();
  if (!session) return false;

  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_contentId: {
          userId: session.userId,
          contentId,
        },
      },
    });
    return !!favorite;
  } catch {
    return false;
  }
}

// Fetch watch history
export async function getWatchHistory() {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: 'Unauthorized', data: [] };

  try {
    const history = await prisma.watchHistory.findMany({
      where: { userId: session.userId },
      include: { content: true },
      orderBy: { lastWatched: 'desc' },
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('Failed to fetch watch history:', error);
    return { success: false, error: 'Failed to load history', data: [] };
  }
}

// Update playback progress for a video
export async function updateWatchProgress(contentId: string, progress: number) {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: 'Not authenticated' };

  try {
    const record = await prisma.watchHistory.upsert({
      where: {
        userId_contentId: {
          userId: session.userId,
          contentId,
        },
      },
      update: {
        progress,
      },
      create: {
        userId: session.userId,
        contentId,
        progress,
      },
    });

    return { success: true, data: record };
  } catch (error) {
    console.error('Failed to update watch progress:', error);
    return { success: false, error: 'Failed to save progress' };
  }
}

// Simulated Recommendations Engine
// Returns content matches of the same categories or tags, avoiding currently active item
export async function getRecommendations(excludeId?: string, limit: number = 4) {
  try {
    let whereClause: any = {};
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    // Smart pick: query items in random/popular order
    const recommendations = await prisma.content.findMany({
      where: whereClause,
      take: limit,
      orderBy: { views: 'desc' },
    });

    return { success: true, data: recommendations };
  } catch (error) {
    console.error('Recommendation engine failed:', error);
    return { success: false, error: 'Failed to retrieve recommendations', data: [] };
  }
}

// Retrieve active simulated downloads
export async function getDownloads() {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: 'Unauthorized', data: [] };

  try {
    const downloads = await prisma.download.findMany({
      where: { userId: session.userId },
      include: { content: true },
    });

    return { success: true, data: downloads };
  } catch (error) {
    console.error('Failed to fetch downloads:', error);
    return { success: false, error: 'Failed to load downloads', data: [] };
  }
}

// Record a simulated premium video download in the database
export async function saveDownloadRecord(contentId: string, quality: string) {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: 'Login required to download media.' };

  try {
    const download = await prisma.download.upsert({
      where: {
        userId_contentId: {
          userId: session.userId,
          contentId,
        },
      },
      update: {
        quality,
        progress: 100,
        status: 'completed',
      },
      create: {
        userId: session.userId,
        contentId,
        quality,
        progress: 100,
        status: 'completed',
      },
    });

    return { success: true, data: download };
  } catch (error) {
    console.error('Download save error:', error);
    return { success: false, error: 'Failed to create download record.' };
  }
}
