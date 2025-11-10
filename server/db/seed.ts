/**
 * Database seeding script
 * Run with: npm run db:seed
 */

import { db } from "../db";
import { accountingService } from "../services/accountingService";

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed tax categories
    console.log('📊 Seeding tax categories...');
    await accountingService.seedTaxCategories();
    console.log('✅ Tax categories seeded');

    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
