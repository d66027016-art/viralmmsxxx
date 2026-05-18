import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with live production backup data...');

  // Clean existing data in reverse order of relationships
  console.log('Cleaning old records...');
  await prisma.booking.deleteMany({});
  await prisma.download.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.watchHistory.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.girl.deleteMany({});

  // 1. Seed Categories
  console.log('Seeding Categories...');
  const categories = [
    {
      id: '3be80329-657b-43a8-b188-b094db1dca2a',
      name: 'VERIFIED',
      createdAt: new Date('2026-05-18T20:14:21.652Z'),
    },
    {
      id: '37e21628-90dd-4813-91ad-751d653f3da8',
      name: 'VIRAL',
      createdAt: new Date('2026-05-18T20:16:00.696Z'),
    }
  ];

  for (const cat of categories) {
    await prisma.category.create({
      data: cat,
    });
  }

  // 2. Seed Users (with original bcrypt password hashes preserved)
  console.log('Seeding Users...');
  const users = [
    {
      id: 'afdfc843-923d-4893-afa6-4ccba58993a4',
      name: 'Admin User',
      email: 'admin@hotwebhd.com',
      passwordHash: '$2b$10$2gqvfhbgYRdd446IT0OnS.YlexH7G3YmLkmWIjlsst/jmNtfHtxkO',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      subscription: 'premium',
      createdAt: new Date('2026-05-18T20:12:09.015Z'),
    },
    {
      id: '25216cf8-75bd-4293-94a9-a92a08fc6dc2',
      name: 'Regular Viewer',
      email: 'user@hotwebhd.com',
      passwordHash: '$2b$10$2gqvfhbgYRdd446IT0OnS.JikjpPpkvYCNBafpgYPpeTpCfObxgmS',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      subscription: 'free',
      createdAt: new Date('2026-05-18T20:12:09.623Z'),
    },
    {
      id: 'e2b81b9d-37ad-4004-b9f5-233141c4eb39',
      name: 'Premium Collector',
      email: 'premium@hotwebhd.com',
      passwordHash: '$2b$10$2gqvfhbgYRdd446IT0OnS.JikjpPpkvYCNBafpgYPpeTpCfObxgmS',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      subscription: 'premium',
      createdAt: new Date('2026-05-18T20:12:09.898Z'),
    },
    {
      id: '2ce38f76-0e54-4d8b-b4d0-e79c87f9b038',
      name: 'naughtymine',
      email: 'ytyt12287@gmail.com',
      passwordHash: '$2b$10$G/kjF736sHuG1CK12gaIMea2uWAc99j4BYGjOqpKJhIM94/mOkX3m',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      subscription: 'free',
      createdAt: new Date('2026-05-18T20:24:18.575Z'),
    }
  ];

  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }

  // 3. Seed Content/Videos
  console.log('Seeding Content...');
  const contents = [
    {
      id: 'e96fd8dd-72ad-452c-8245-2a43800ed7aa',
      title: 'VERIFIED',
      description: 'VERIFIED BY SUJAL (DAMXD89)',
      category: 'VERIFIED',
      tags: 'desivillagegirlpinterestdesi,viraltelegramgrouplink,desiviralvideolink,desiviralclips,girldesiviral,desiviralvideotrending,leakedtelegramgroup,leakedepsteinfiles,viralvideoindian,viralvideo19minutes,viral,videogirl19minutes,instagramviralvideo,viralvideolinkwebsitelist,viralvideolinktoday,viralvideolinkoriginaldownloadviralvideolinkwebsitefree,fry99sex,masahubpornvideos,mydesimms,desiporn,desi49porn,mydesisex,desibfporn,chiggywiggyporn,mydesitles2sex,fsiblog,fsiblogporn,kamabba,kamababaporn,uncutaddasex,aagmalvideos,sexclips,sexvideo,viralmms,indianwebseries,indiangirlviralvideos,bangladeshiviralvideolink,bangladeshiviralvideotiktok,bdviraltelegramvideolink,bdvirallinkterabox',
      thumbnail: 'https://files.catbox.moe/zd4qlh.jpg',
      videoUrl: 'https://files.catbox.moe/81r8ih.mp4',
      duration: '1 MIN',
      views: 0,
      likes: 0,
      qualities: '1080p,720p',
      createdAt: new Date('2026-05-18T20:15:51.685Z'),
    },
    {
      id: '22e7605d-bf68-4e31-a75b-42cd7852c5c5',
      title: 'helping a boy to loosing their virginity',
      description: 'HELPING A BOY TO LOSE . .',
      category: 'VERIFIED',
      tags: 'desivillagegirlpinterestdesi,viraltelegramgrouplink,desiviralvideolink,desiviralclips,girldesiviral,desiviralvideotrending,leakedtelegramgroup,leakedepsteinfiles,viralvideoindian,viralvideo19minutes,viral,videogirl19minutes,instagramviralvideo,viralvideolinkwebsitelist,viralvideolinktoday,viralvideolinkoriginaldownloadviralvideolinkwebsitefree,fry99sex,masahubpornvideos,mydesimms,desiporn,desi49porn,mydesisex,desibfporn,chiggywiggyporn,mydesitles2sex,fsiblog,fsiblogporn,kamabba,kamababaporn,uncutaddasex,aagmalvideos,sexclips,sexvideo,viralmms,indianwebseries,indiangirlviralvideos,bangladeshiviralvideolink,bangladeshiviralvideotiktok,bdviraltelegramvideolink,bdvirallinkterabox',
      thumbnail: 'https://files.catbox.moe/e247nh.jpg',
      videoUrl: 'https://files.catbox.moe/z3o2ek.mp4',
      duration: '1MIN',
      views: 0,
      likes: 0,
      qualities: '1080p,720p',
      createdAt: new Date('2026-05-18T20:17:40.829Z'),
    }
  ];

  for (const item of contents) {
    await prisma.content.create({
      data: item,
    });
  }

  // 4. Seed Escort Profiles (Girls)
  console.log('Seeding Girls...');
  const girls = [
    {
      id: '2ff95d0c-d09c-44bd-a456-fc41ea18a572',
      name: 'RADHIKA',
      age: 21,
      location: 'Delhi',
      category: 'Supermodel',
      ratePerHour: 1500,
      ratePerDay: 5000,
      avatar: 'https://files.catbox.moe/kfaii0.png',
      images: 'https://files.catbox.moe/kfaii0.png',
      bio: 'all positions and bj',
      rating: 5.0,
      reviewsCount: 1,
      available: true,
      createdAt: new Date('2026-05-18T20:18:38.832Z'),
    },
    {
      id: '32cd1a4d-ba57-441e-adad-045816ccf562',
      name: 'DIVYA',
      age: 28,
      location: 'Hyderabad',
      category: 'VIP Russian',
      ratePerHour: 1500,
      ratePerDay: 7000,
      avatar: 'https://files.catbox.moe/lskjg7.jpeg',
      images: 'https://files.catbox.moe/lskjg7.jpeg',
      bio: 'all positions and bj',
      rating: 5.0,
      reviewsCount: 1,
      available: true,
      createdAt: new Date('2026-05-18T20:19:32.602Z'),
    },
    {
      id: '444d6c86-588e-4446-bb7f-9b86df624c75',
      name: 'ISITHA',
      age: 25,
      location: 'Bengaluru',
      category: 'Supermodel',
      ratePerHour: 2500,
      ratePerDay: 10000,
      avatar: 'https://files.catbox.moe/gvkpxl.jpeg',
      images: 'https://files.catbox.moe/gvkpxl.jpeg',
      bio: 'all positions and bj',
      rating: 5.0,
      reviewsCount: 1,
      available: true,
      createdAt: new Date('2026-05-18T20:20:28.904Z'),
    },
    {
      id: '31fd5c62-f24e-439f-b1c3-13bd8854c39a',
      name: 'MUSKAN',
      age: 28,
      location: 'Bengaluru',
      category: 'VIP Russian',
      ratePerHour: 2500,
      ratePerDay: 9000,
      avatar: 'https://files.catbox.moe/gmq0a6.jpeg',
      images: 'https://files.catbox.moe/gmq0a6.jpeg',
      bio: 'all positions and bj',
      rating: 5.0,
      reviewsCount: 1,
      available: true,
      createdAt: new Date('2026-05-18T20:21:24.345Z'),
    },
    {
      id: '17676d85-eebc-4eaa-b598-684eff752e3d',
      name: 'RIYA',
      age: 22,
      location: 'Mumbai',
      category: 'Celebrity Escort',
      ratePerHour: 1500,
      ratePerDay: 5000,
      avatar: 'https://files.catbox.moe/a3w8ul.jpeg',
      images: 'https://files.catbox.moe/a3w8ul.jpeg',
      bio: 'all positions and bj',
      rating: 5.0,
      reviewsCount: 1,
      available: true,
      createdAt: new Date('2026-05-18T20:22:06.732Z'),
    },
    {
      id: '3317fe12-55c7-425e-b245-4c15bd7e4b10',
      name: 'TANVI',
      age: 20,
      location: 'Goa',
      category: 'Elite Local',
      ratePerHour: 5000,
      ratePerDay: 5000,
      avatar: 'https://files.catbox.moe/2vf94h.jpeg',
      images: 'https://files.catbox.moe/2vf94h.jpeg',
      bio: 'all positions and bj',
      rating: 5.0,
      reviewsCount: 1,
      available: true,
      createdAt: new Date('2026-05-18T20:22:40.096Z'),
    },
    {
      id: '78b04770-2ce7-4367-96db-d0d77cd9d7ff',
      name: 'ANGELI',
      age: 26,
      location: 'Delhi',
      category: 'Elite Local',
      ratePerHour: 1498,
      ratePerDay: 6000,
      avatar: 'https://files.catbox.moe/pm6q3u.jpeg',
      images: 'https://files.catbox.moe/pm6q3u.jpeg',
      bio: 'all positions and bj',
      rating: 5.0,
      reviewsCount: 1,
      available: true,
      createdAt: new Date('2026-05-18T20:23:15.313Z'),
    }
  ];

  for (const girl of girls) {
    await prisma.girl.create({
      data: girl,
    });
  }

  // 5. Seed Bookings
  console.log('Seeding Bookings...');
  const bookings = [
    {
      id: '48383104-0132-4069-a49f-cb7a7feed911',
      userId: '2ce38f76-0e54-4d8b-b4d0-e79c87f9b038',
      girlId: '31fd5c62-f24e-439f-b1c3-13bd8854c39a',
      bookingDate: new Date('2026-05-19T02:57:00.000Z'),
      bookingType: 'daily',
      durationHours: 0,
      durationDays: 1,
      totalPrice: 9000,
      status: 'cancelled',
      location: 'HJWEBJDDLJSDKKLW',
      contactPhone: '8905582659',
      notes: 'SBDJBKBDFBKJ',
      createdAt: new Date('2026-05-18T20:25:28.171Z'),
    }
  ];

  for (const booking of bookings) {
    await prisma.booking.create({
      data: booking,
    });
  }

  console.log('Database seeded successfully with production data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
