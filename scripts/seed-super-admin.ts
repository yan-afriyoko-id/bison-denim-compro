import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const SUPER_ADMIN = {
  email: 'admin@gmail.com',
  password: 'password',
  full_name: 'Super Admin',
  role: 'super_admin' as const,
};

async function applyMigration() {
  const migrationPath = join(__dirname, '../supabase/migrations/00001_initial_schema.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📦 Applying initial schema migration...\n');

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // rpc may not exist — try the REST SQL endpoint
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!res.ok) {
      console.error('❌ Cannot apply migration automatically.');
      console.error('');
      console.error('Please apply the migration manually in Supabase Dashboard:');
      console.error('   1. Open Supabase Dashboard → SQL Editor');
      console.error('   2. Paste the contents of supabase/migrations/00001_initial_schema.sql');
      console.error('   3. Click "Run"\n');
      process.exit(1);
    }
  }

  console.log('✅ Migration applied.\n');
}

async function seed() {
  console.log('🌱 Seeding super admin account...\n');
  console.log(`   Email:    ${SUPER_ADMIN.email}`);
  console.log(`   Password: ${SUPER_ADMIN.password}`);
  console.log(`   Role:     ${SUPER_ADMIN.role}\n`);

  // Step 1: Try to apply migration if profiles table doesn't exist
  const { error: tableCheckError } = await supabase.from('profiles').select('id').limit(1);
  if (tableCheckError && tableCheckError.message.includes('does not exist')) {
    await applyMigration();
  }

  // Step 2: Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();

  const existingUser = existingUsers?.users?.find(
    (u) => u.email === SUPER_ADMIN.email
  );

  if (existingUser) {
    console.log('⚠️  User already exists. Updating role to super_admin...\n');

    // Update role via direct SQL (service role bypasses RLS)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: SUPER_ADMIN.full_name,
        role: SUPER_ADMIN.role,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id);

    if (updateError) {
      console.error('❌ Failed to update profile:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Profile updated to super_admin.\n');
    process.exit(0);
  }

  // Step 3: Create user in Supabase Auth
  // The trigger handle_new_user will auto-create profile with role='viewer'
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: SUPER_ADMIN.email,
    password: SUPER_ADMIN.password,
    email_confirm: true,
    user_metadata: {
      full_name: SUPER_ADMIN.full_name,
    },
  });

  if (authError) {
    console.error('❌ Failed to create auth user:', authError.message);
    process.exit(1);
  }

  if (!authData.user) {
    console.error('❌ No user returned from createUser');
    process.exit(1);
  }

  console.log(`✅ Auth user created (id: ${authData.user.id})\n`);

  // Step 4: Wait briefly for trigger to create profile, then upgrade role
  await new Promise((r) => setTimeout(r, 1500));

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name: SUPER_ADMIN.full_name,
      role: SUPER_ADMIN.role,
      is_active: true,
    })
    .eq('id', authData.user.id);

  if (updateError) {
    // Profile might not exist yet, try insert as fallback
    const { error: insertError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: SUPER_ADMIN.full_name,
      role: SUPER_ADMIN.role,
      is_active: true,
    });

    if (insertError) {
      console.error('❌ Failed to create profile:', insertError.message);
      console.error('🗑️  Cleaning up auth user...');
      await supabase.auth.admin.deleteUser(authData.user.id);
      process.exit(1);
    }
  }

  console.log('✅ Profile created with super_admin role.\n');
  console.log('🎉 Super admin seeded! You can now login at /auth/login\n');
}

seed();
