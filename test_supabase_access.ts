/**
 * TEST FILE - Run this to verify Supabase database access
 * 
 * This will test if your anon key can:
 * 1. Query the users table
 * 2. Insert a test record
 * 3. Delete the test record
 */

import { supabase } from './src/config/supabase';

async function testDatabaseAccess() {
  console.log('🔍 Testing Supabase database access...\n');

  // Test 1: Can we query the users table?
  console.log('1️⃣ Testing SELECT on users table...');
  const { data: selectData, error: selectError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (selectError) {
    console.error('❌ SELECT failed:', selectError.message);
  } else {
    console.log('✅ SELECT works! Found', selectData?.length || 0, 'records');
  }

  // Test 2: Can we insert without auth?
  console.log('\n2️⃣ Testing INSERT on users table...');
  const testEmail = `test_${Date.now()}@example.com`;
  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .insert({
      name: 'Test User',
      email: testEmail,
      password: 'hashed_password_placeholder',
    })
    .select();

  if (insertError) {
    console.error('❌ INSERT failed:', insertError.message);
  } else {
    console.log('✅ INSERT works! Created test user:', insertData?.[0]?.id);

    // Test 3: Clean up - delete the test record
    if (insertData?.[0]?.id) {
      console.log('\n3️⃣ Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('❌ DELETE failed:', deleteError.message);
      } else {
        console.log('✅ DELETE works! Test data cleaned up');
      }
    }
  }

  // Test 4: Check auth.signUp directly (without trying to save to users table)
  console.log('\n4️⃣ Testing Supabase Auth directly...');
  const testAuthEmail = `authtest_${Date.now()}@example.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testAuthEmail,
    password: 'TestPass123!',
    options: {
      emailRedirectTo: undefined,
    }
  });

  if (authError) {
    console.error('❌ Auth signup failed:', authError.message);
    if (authError.message.includes('rate limit')) {
      console.log('⚠️  RATE LIMIT is the issue - not permissions!');
    }
  } else {
    console.log('✅ Auth signup works! User ID:', authData.user?.id);
    
    // Clean up auth user if created
    if (authData.user?.id) {
      console.log('Note: Auth user created but needs manual cleanup in Supabase dashboard');
    }
  }

  console.log('\n✨ Test complete!');
}

// Run the test
testDatabaseAccess().catch(console.error);
