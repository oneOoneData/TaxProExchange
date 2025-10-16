#!/usr/bin/env node
/**
 * Script to trigger HubSpot sync
 * 
 * Usage: node scripts/sync-hubspot.js
 * 
 * Note: You must be logged in as an admin on taxproexchange.com
 * and provide your session cookie.
 */

const https = require('https');

const url = 'https://www.taxproexchange.com/api/admin/hubspot-sync';

console.log('🔄 Starting HubSpot sync...\n');

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.ok) {
        console.log('✅ HubSpot sync completed successfully!\n');
        console.log('Summary:');
        console.log(`  Total profiles: ${result.summary.total}`);
        console.log(`  ✅ Synced: ${result.summary.synced}`);
        console.log(`  ❌ Failed: ${result.summary.failed}`);
        console.log(`  ⏭️  Skipped (no email): ${result.summary.skipped}\n`);
        
        if (result.failures && result.failures.length > 0) {
          console.log('First few failures:');
          result.failures.forEach((f, i) => {
            console.log(`  ${i + 1}. ${f.email}: ${f.reason}`);
          });
        }
      } else {
        console.error('❌ Sync failed:', result.error);
        if (res.statusCode === 403) {
          console.error('\n⚠️  You need to be logged in as an admin to run this sync.');
          console.error('Please visit https://www.taxproexchange.com and log in as admin first.');
        }
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();

