#!/usr/bin/env node

/**
 * Backfill script to add comparables data for all existing properties
 * This script uses the Next.js API endpoints to backfill comparables data
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function backfillComparablesData() {
  try {
    console.log('🔄 Starting comparables data backfill...');
    console.log(`🌐 Using API base URL: ${BASE_URL}`);
    
    // Call the backfill API endpoint
    const response = await fetch(`${BASE_URL}/api/db/backfill-comparables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error || errorData.message}`);
    }
    
    const result = await response.json();
    
    console.log('\n📈 Backfill Summary:');
    console.log(`  ✅ Successfully created: ${result.successCount} entries`);
    console.log(`  ❌ Failed to create: ${result.errorCount} entries`);
    console.log(`  📊 Total processed: ${result.processed} properties`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.errorCount > 0) {
      console.log('\n⚠️  Some entries failed to create. Check the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 Backfill completed successfully!');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillComparablesData();