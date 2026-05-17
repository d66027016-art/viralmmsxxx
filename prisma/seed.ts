import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.download.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.watchHistory.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed default categories
  const defaultCategories = ["Sci-Fi", "Anime", "Comedy", "Sports", "Documentary"];
  for (const name of defaultCategories) {
    await prisma.category.create({
      data: { name }
    });
  }

  // Seed Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const userPassword = await bcrypt.hash('user123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@hotwebhd.com',
      passwordHash: adminPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      subscription: 'premium',
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      name: 'Regular Viewer',
      email: 'user@hotwebhd.com',
      passwordHash: userPassword,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      subscription: 'free',
    },
  });

  const premiumUser = await prisma.user.create({
    data: {
      name: 'Premium Collector',
      email: 'premium@hotwebhd.com',
      passwordHash: userPassword,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      subscription: 'premium',
    },
  });

  // Seed Content (Premium HD/4K trailers and videos)
  const items = [
    {
      title: 'Tears of Steel - Cyberpunk Sci-Fi',
      description: 'In a futuristic Amsterdam, a group of scientists and soldiers attempt to save the city from rampaging giant robots using a cybernetic love story as their final weapon. Staring premium VFX and adaptive full-HD visuals.',
      category: 'Sci-Fi',
      tags: 'scifi,robots,action,cyberpunk,vfx',
      thumbnail: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      duration: '12m 14s',
      views: 12450,
      likes: 852,
      qualities: '1080p,720p',
    },
    {
      title: 'Sintel - Legendary Anime & Fantasy',
      description: 'A beautiful and epic fantasy animation following a young woman named Sintel on her journey to rescue a baby dragon. Along her search, she faces severe hardships and learns the high price of her attachment.',
      category: 'Anime',
      tags: 'anime,fantasy,dragon,adventure,cgi',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      duration: '14m 48s',
      views: 8930,
      likes: 642,
      qualities: '1080p,720p',
    },
    {
      title: 'Big Buck Bunny - Forest Comedy',
      description: 'A giant, soft-hearted rabbit awakens to a beautiful sunny day in his forest home. But when three mischievous rodents pick a fight, Bunny hatches a hilariously complex and tactical plan to teach them a lesson!',
      category: 'Comedy',
      tags: 'comedy,animation,funny,animals,cgi',
      thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: '9m 56s',
      views: 15300,
      likes: 1205,
      qualities: '1080p,720p',
    },
    {
      title: 'Elephants Dream - Surreal Steampunk',
      description: 'A mind-bending journey of Proog and Emo, two men exploring a massive, bizarre mechanical typewriter-like world. They face different opinions on the nature of their environment in a visually breathtaking steampunk classic.',
      category: 'Sci-Fi',
      tags: 'steampunk,scifi,fantasy,surreal,weird',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      duration: '10m 53s',
      views: 5410,
      likes: 310,
      qualities: '1080p,720p',
    },
    {
      title: 'Subaru Impreza - Burning Speed',
      description: 'Experience pure speed and adrenaline with the Subaru WRX as it tears up the tarmac and powers through high-speed curves. A high-performance commercial demonstrating precision action engineering and full 4K HDR playback capability.',
      category: 'Sports',
      tags: 'cars,racing,speed,action,commercial',
      thumbnail: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: '0m 15s',
      views: 22040,
      likes: 1980,
      qualities: '1080p,720p',
    },
    {
      title: 'The Great Wilderness - Documentary',
      description: 'Journey deep into the untouched corners of the earth. From majestic alpine ranges to shimmering deep-sea ecosystems, discover the diverse wildlife, sweeping vistas, and delicate balance of our planet in stunning detail.',
      category: 'Documentary',
      tags: 'documentary,nature,wildlife,earth,adventure',
      thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      duration: '0m 47s',
      views: 7420,
      likes: 560,
      qualities: '1080p,720p',
    }
  ];

  for (const item of items) {
    await prisma.content.create({
      data: item,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
