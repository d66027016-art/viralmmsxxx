import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.booking.deleteMany({});
  await prisma.download.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.watchHistory.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.girl.deleteMany({});

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

  // Seed Curated Verified Escort/Model Profiles
  const girls = [
    {
      name: 'Elena Rostova',
      age: 23,
      location: 'Mumbai',
      category: 'VIP Russian',
      ratePerHour: 6500,
      ratePerDay: 50000,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
      images: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500,https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500',
      bio: 'Professional fashion model and premium host. Elegant, conversational, and highly trained in high-society social gatherings.',
      rating: 4.9,
      reviewsCount: 18,
      available: true
    },
    {
      name: 'Priya Sen',
      age: 24,
      location: 'Delhi',
      category: 'Elite Local',
      ratePerHour: 4500,
      ratePerDay: 35000,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      images: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500,https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
      bio: 'Bubbly college graduate, art enthusiast, and elite host. Offers perfect companionship for cinema halls, corporate dinners, and premium dates.',
      rating: 5.0,
      reviewsCount: 24,
      available: true
    },
    {
      name: 'Sophia Loren',
      age: 22,
      location: 'Goa',
      category: 'Celebrity',
      ratePerHour: 8000,
      ratePerDay: 60000,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
      images: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500,https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
      bio: 'Stunning luxury traveler and social influencer. Loves beachside dinners, club events, and high-end yacht dates.',
      rating: 4.8,
      reviewsCount: 14,
      available: true
    },
    {
      name: 'Aisha Sharma',
      age: 25,
      location: 'Bengaluru',
      category: 'Elite Local',
      ratePerHour: 5000,
      ratePerDay: 40000,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      images: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      bio: 'Sensual, intellectual, and sweet-natured. Perfect partner for quiet private conversations, gourmet dining, and high-fidelity movie experiences.',
      rating: 4.9,
      reviewsCount: 31,
      available: true
    },
    {
      name: 'Natasha Romanoff',
      age: 26,
      location: 'Mumbai',
      category: 'VIP Russian',
      ratePerHour: 7500,
      ratePerDay: 55000,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
      images: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
      bio: 'Breathtaking elegance paired with excellent hospitality. Multi-lingual companion who thrives in premium cocktail mixers and luxurious private parties.',
      rating: 5.0,
      reviewsCount: 12,
      available: true
    },
    {
      name: 'Kavya Reddy',
      age: 21,
      location: 'Bengaluru',
      category: 'Elite Local',
      ratePerHour: 4000,
      ratePerDay: 30000,
      avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500',
      images: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      bio: 'Passionate dancer, cheerful college companion, and cinema lover. Extremely photogenic and highly requested for premium weekend cinema escapes.',
      rating: 4.7,
      reviewsCount: 9,
      available: true
    }
  ];

  for (const item of items) {
    await prisma.content.create({
      data: item,
    });
  }

  for (const girl of girls) {
    await prisma.girl.create({
      data: girl,
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
