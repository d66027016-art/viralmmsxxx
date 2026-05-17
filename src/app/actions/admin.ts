"use server";

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Authenticate that the user is the administrator
async function verifyAdmin() {
  const session = await getCurrentUser();
  if (!session || session.email !== 'admin@hotwebhd.com') {
    throw new Error('Unauthorized administrative access.');
  }
  return session;
}

// Upload a new piece of content to the platform
export async function uploadContent(prevState: any, formData: FormData) {
  try {
    await verifyAdmin();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;
    const duration = formData.get('duration') as string;
    const qualities = formData.get('qualities') as string || '1080p,720p';

    // Parse files from FormData
    const videoFile = formData.get('videoFile') as File | null;
    const thumbnailFile = formData.get('thumbnailFile') as File | null;
    
    let videoUrl = formData.get('videoUrl') as string || '';
    let thumbnail = formData.get('thumbnail') as string || '';

    // Handle Local Video File Upload
    if (videoFile && videoFile.size > 0 && typeof videoFile.arrayBuffer === 'function') {
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure the directory exists
      await mkdir(uploadsDir, { recursive: true });
      
      const filename = `video_${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = path.join(uploadsDir, filename);
      await writeFile(filePath, new Uint8Array(buffer));
      
      videoUrl = `/uploads/${filename}`;
    }

    // Handle Local Thumbnail File Upload
    if (thumbnailFile && thumbnailFile.size > 0 && typeof thumbnailFile.arrayBuffer === 'function') {
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure the directory exists
      await mkdir(uploadsDir, { recursive: true });
      
      const filename = `thumb_${Date.now()}_${thumbnailFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = path.join(uploadsDir, filename);
      await writeFile(filePath, new Uint8Array(buffer));
      
      thumbnail = `/uploads/${filename}`;
    }

    if (!title || !description || !category || !tags || !thumbnail || !videoUrl || !duration) {
      return { success: false, error: 'All fields are required. Please select or paste a video and thumbnail.' };
    }

    const content = await prisma.content.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tags.toLowerCase().replace(/\s+/g, ''),
        thumbnail: thumbnail.trim(),
        videoUrl: videoUrl.trim(),
        duration: duration.trim(),
        qualities,
      },
    });

    return { success: true, message: 'Content published successfully!', data: content };
  } catch (error: any) {
    console.error('Upload content error:', error);
    return { success: false, error: error.message || 'Failed to upload content.' };
  }
}

// Delete content from the platform database
export async function deleteContent(id: string) {
  try {
    await verifyAdmin();

    await prisma.content.delete({
      where: { id },
    });

    return { success: true, message: 'Content deleted successfully.' };
  } catch (error: any) {
    console.error('Delete content error:', error);
    return { success: false, error: error.message || 'Failed to delete content.' };
  }
}

// Fetch aggregate analytics for the administrative dashboard
export async function getAnalytics() {
  try {
    await verifyAdmin();

    const totalViewsObj = await prisma.content.aggregate({
      _sum: {
        views: true,
      },
    });

    const totalLikesObj = await prisma.content.aggregate({
      _sum: {
        likes: true,
      },
    });

    const totalContent = await prisma.content.count();
    const totalUsers = await prisma.user.count();
    const premiumUsers = await prisma.user.count({
      where: { subscription: 'premium' },
    });
    const totalFavorites = await prisma.favorite.count();
    const totalDownloads = await prisma.download.count();

    const totalViews = totalViewsObj._sum.views || 0;
    const totalLikes = totalLikesObj._sum.likes || 0;

    // Fetch popular items
    const popularContent = await prisma.content.findMany({
      orderBy: { views: 'desc' },
      take: 5,
    });

    return {
      success: true,
      data: {
        totalViews,
        totalLikes,
        totalContent,
        totalUsers,
        premiumUsers,
        totalFavorites,
        totalDownloads,
        popularContent,
      },
    };
  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return { success: false, error: error.message || 'Failed to fetch analytics.' };
  }
}

// Create a new dynamic category (Admin only)
export async function createCategory(prevState: any, formData: FormData) {
  try {
    await verifyAdmin();

    const name = formData.get('name') as string;
    if (!name || name.trim() === '') {
      return { success: false, error: 'Category name is required.' };
    }

    const trimmedName = name.trim();

    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return { success: false, error: 'Category already exists.' };
    }

    const category = await prisma.category.create({
      data: { name: trimmedName },
    });

    return { success: true, message: `Category "${trimmedName}" created successfully!`, data: category };
  } catch (error: any) {
    console.error('Create category error:', error);
    return { success: false, error: error.message || 'Failed to create category.' };
  }
}

// Delete an existing category (Admin only)
export async function deleteCategory(id: string) {
  try {
    await verifyAdmin();

    await prisma.category.delete({
      where: { id },
    });

    return { success: true, message: 'Category deleted successfully.' };
  } catch (error: any) {
    console.error('Delete category error:', error);
    return { success: false, error: error.message || 'Failed to delete category.' };
  }
}

// Fetch all categories (Publicly readable)
export async function getCategoriesList() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: categories };
  } catch (error: any) {
    console.error('Get categories list error:', error);
    return { success: false, error: 'Failed to retrieve categories list.', data: [] };
  }
}
