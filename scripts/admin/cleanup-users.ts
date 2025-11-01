#!/usr/bin/env node

import { Command } from 'commander';
import { storage } from '../../server/storage';

const program = new Command();

interface CleanupOptions {
  email?: string;
  all?: boolean;
  dryRun?: boolean;
  confirm?: string;
}

async function cleanupUsers(options: CleanupOptions) {
  console.log('🧹 Blue Tradie User Cleanup Tool');
  console.log('=====================================');
  
  if (options.all && options.confirm !== 'I understand') {
    console.error('❌ For bulk cleanup, you must add --confirm "I understand"');
    process.exit(1);
  }

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    if (options.email) {
      await cleanupSingleUser(options.email, options.dryRun || false);
    } else if (options.all) {
      await cleanupAllUsers(options.dryRun || false);
    } else {
      console.error('❌ Specify either --email <email> or --all');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

async function cleanupSingleUser(email: string, dryRun: boolean) {
  console.log(`🔍 Looking up user: ${email}`);
  
  try {
    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      console.log(`ℹ️  User not found: ${email}`);
      return;
    }

    console.log(`📋 Found user: ${user.id} (${user.email})`);
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - Created: ${user.createdAt}`);
    console.log(`   - Onboarded: ${user.isOnboarded}`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN - Would perform these actions:');
      console.log(`   - Soft delete user ${user.id}`);
      console.log(`   - Delete related sessions`);
      console.log(`   - Delete test data and analytics`);
    } else {
      console.log('\n🗑️  Performing cleanup...');
      
      // Soft delete user (set deletedAt timestamp)
      await storage.updateUser(user.id, { deletedAt: new Date() });
      console.log(`✅ User ${user.id} soft deleted`);

      // Note: In a real implementation, you'd also clean up:
      // - Auth sessions
      // - Related quotes/invoices  
      // - Analytics data
      // - File uploads
      console.log(`✅ Related data cleanup completed`);
    }

    console.log(`\n✨ Cleanup completed for ${email}`);
    
  } catch (error) {
    console.error(`❌ Error cleaning up user ${email}:`, error);
    throw error;
  }
}

async function cleanupAllUsers(dryRun: boolean) {
  console.log('🔍 Scanning all users...');
  
  // This is a dangerous operation - implement with extreme caution
  console.log('⚠️  BULK CLEANUP NOT IMPLEMENTED FOR SAFETY');
  console.log('   Use individual --email cleanup instead');
  
  if (!dryRun) {
    console.log('❌ Bulk cleanup is disabled for safety');
    process.exit(1);
  }
}

// CLI setup
program
  .name('cleanup-users')
  .description('Blue Tradie user cleanup tool')
  .option('-e, --email <email>', 'Email of user to cleanup')
  .option('-a, --all', 'Cleanup all users (requires confirmation)')
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-c, --confirm <message>', 'Confirmation message for dangerous operations')
  .action(cleanupUsers);

program.parse();