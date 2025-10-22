#!/usr/bin/env node
/**
 * Check for clerk_id mismatches between database and Clerk
 * 
 * This finds users whose clerk_id in the database doesn't match
 * their current Clerk account (found by email lookup)
 */

const { createClient } = require('@supabase/supabase-js');

async function checkClerkIdMismatches() {
  // Setup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey || !clerkSecretKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all profiles with emails
  console.log('📊 Fetching all profiles...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, clerk_id, public_email, first_name, last_name')
    .not('public_email', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching profiles:', error);
    process.exit(1);
  }

  console.log(`✅ Found ${profiles.length} profiles with emails\n`);

  // Check each profile against Clerk
  const mismatches = [];
  const notFoundInClerk = [];
  let checked = 0;

  console.log('🔍 Checking Clerk for each email...\n');

  for (const profile of profiles) {
    checked++;
    
    if (checked % 50 === 0) {
      console.log(`Progress: ${checked}/${profiles.length}`);
    }

    try {
      // Search Clerk for user by email
      const response = await fetch(
        `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(profile.public_email)}`,
        {
          headers: {
            'Authorization': `Bearer ${clerkSecretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`⚠️  Clerk API error for ${profile.public_email}: ${response.status}`);
        continue;
      }

      const users = await response.json();

      if (users.length === 0) {
        // User not found in Clerk (deleted account?)
        notFoundInClerk.push({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`,
          email: profile.public_email,
          db_clerk_id: profile.clerk_id,
        });
      } else if (users.length > 1) {
        console.warn(`⚠️  Multiple Clerk accounts for ${profile.public_email}`);
      } else {
        const clerkUser = users[0];
        
        // Check if IDs match
        if (profile.clerk_id !== clerkUser.id) {
          mismatches.push({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.public_email,
            db_clerk_id: profile.clerk_id,
            current_clerk_id: clerkUser.id,
          });
        }
      }

      // Rate limit: be nice to Clerk API (100 requests/min = ~600ms between requests)
      await new Promise(resolve => setTimeout(resolve, 650));

    } catch (err) {
      console.error(`❌ Error checking ${profile.public_email}:`, err.message);
    }
  }

  // Report results
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS');
  console.log('='.repeat(60) + '\n');

  console.log(`✅ Total profiles checked: ${checked}`);
  console.log(`🟡 Mismatched clerk_ids: ${mismatches.length}`);
  console.log(`🔴 Not found in Clerk: ${notFoundInClerk.length}\n`);

  if (mismatches.length > 0) {
    console.log('🟡 MISMATCHED CLERK IDs (like Jeremy):');
    console.log('These users may have deleted/recreated their Clerk accounts\n');
    mismatches.forEach(m => {
      console.log(`  Name: ${m.name}`);
      console.log(`  Email: ${m.email}`);
      console.log(`  DB clerk_id:      ${m.db_clerk_id}`);
      console.log(`  Current clerk_id: ${m.current_clerk_id}`);
      console.log('  Status: ⚠️  Will fail profile updates until they use the app\n');
    });
  }

  if (notFoundInClerk.length > 0) {
    console.log('\n🔴 NOT FOUND IN CLERK:');
    console.log('These profiles exist in DB but Clerk account is deleted\n');
    notFoundInClerk.forEach(n => {
      console.log(`  Name: ${n.name}`);
      console.log(`  Email: ${n.email}`);
      console.log(`  DB clerk_id: ${n.db_clerk_id}\n`);
    });
  }

  console.log('='.repeat(60));
  console.log('\n💡 Our fix handles mismatches automatically:');
  console.log('   When users log in and update their profile, clerk_id syncs automatically\n');
}

checkClerkIdMismatches().catch(console.error);

