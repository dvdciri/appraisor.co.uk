#!/usr/bin/env node

/**
 * Combined backfill script to add both comparables and calculator data for all existing properties
 * This script runs both backfills in sequence
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function runBackfill(endpoint, name) {
  console.log(`\n🔄 Starting ${name} backfill...`);
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
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
  
  console.log(`📈 ${name} Backfill Summary:`);
  console.log(`  ✅ Successfully created: ${result.successCount} entries`);
  console.log(`  ❌ Failed to create: ${result.errorCount} entries`);
  console.log(`  📊 Total processed: ${result.processed} properties`);
  
  if (result.errors && result.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered in ${name} backfill:`);
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (result.errorCount > 0) {
    throw new Error(`${name} backfill had ${result.errorCount} failures`);
  }
  
  console.log(`🎉 ${name} backfill completed successfully!`);
  return result;
}

async function backfillAllData() {
  try {
    console.log('🚀 Starting comprehensive data backfill...');
    console.log(`🌐 Using API base URL: ${BASE_URL}`);
    
    // Run calculator backfill first
    const calculatorResult = await runBackfill('/api/db/backfill-calculator', 'Calculator');
    
    // Run comparables backfill second
    const comparablesResult = await runBackfill('/api/db/backfill-comparables', 'Comparables');
    
    console.log('\n🎉 All backfills completed successfully!');
    console.log('\n📊 Overall Summary:');
    console.log(`  Calculator entries created: ${calculatorResult.successCount}`);
    console.log(`  Comparables entries created: ${comparablesResult.successCount}`);
    console.log(`  Total properties processed: ${Math.max(calculatorResult.processed, comparablesResult.processed)}`);
    
  } catch (error) {
    console.error('💥 Fatal error during backfill:', error);
    process.exit(1);
  }
}

// Run the comprehensive backfill
backfillAllData();
