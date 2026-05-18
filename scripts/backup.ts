import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching data from the database...');

  try {
    const categories = await prisma.category.findMany();
    const contents = await prisma.content.findMany();
    const girls = await prisma.girl.findMany();
    const users = await prisma.user.findMany();
    const bookings = await prisma.booking.findMany();

    console.log(`Successfully fetched:`);
    console.log(`- ${categories.length} Categories`);
    console.log(`- ${contents.length} Content/Videos`);
    console.log(`- ${girls.length} Escort/Model Profiles`);
    console.log(`- ${users.length} Users`);
    console.log(`- ${bookings.length} Bookings`);

    const backupData = {
      timestamp: new Date().toISOString(),
      categories,
      contents,
      girls,
      users,
      bookings
    };

    const backupDir = path.join(__dirname, '../data_backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFilePath = path.join(backupDir, 'backup.json');
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`Backup successfully saved to ${backupFilePath}`);
  } catch (error) {
    console.error('Error during backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
