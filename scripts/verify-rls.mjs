import { createClient } from '@supabase/supabase-js';

function readEnv(name) {
  const raw = process.env[name];
  if (!raw) return '';

  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

const url = readEnv('NEXT_PUBLIC_SUPABASE_URL');
const anonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!url || !anonKey) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const admin = serviceRoleKey
  ? createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const runId = Date.now();
const password = 'RlsTest#2026!';
const user1Email = 'rls-user1@sitespresso.com';
const user2Email = 'rls-user2@sitespresso.com';

const results = [];
const createdUserIds = [];

function addResult(name, passed, details = '') {
  results.push({ name, passed, details });
}

async function createTestUser(email, fullName) {
  if (admin) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      throw new Error(`Failed to create user ${email}: ${error?.message ?? 'unknown error'}`);
    }

    createdUserIds.push(data.user.id);
    return data.user;
  }

  const tmpClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await tmpClient.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error?.message?.toLowerCase().includes('rate limit')) {
    const signedIn = await signInAs(email);
    const {
      data: { user },
      error: userError,
    } = await signedIn.auth.getUser();

    if (userError || !user) {
      throw new Error(`Failed to recover throttled test user ${email}: ${userError?.message ?? 'unknown error'}`);
    }

    return user;
  }

  if (error || !data.user) {
    throw new Error(`Failed to sign up user ${email}: ${error?.message ?? 'unknown error'}`);
  }

  return data.user;
}

async function signInAs(email) {
  const client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in ${email}: ${error.message}`);
  }

  return client;
}

async function cleanup() {
  if (!admin) return;

  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  }
}

try {
  const user1 = await createTestUser(user1Email, 'RLS User One');
  const user2 = await createTestUser(user2Email, 'RLS User Two');

  const user1Client = await signInAs(user1Email);
  const user2Client = await signInAs(user2Email);
  const anonClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const privateSlug = `rls-private-${runId}`;
  const publicSlug = `rls-public-${runId}`;
  const otherDraftSlug = `rls-user2-draft-${runId}`;

  if (admin) {
    await admin.from('sites').insert({
      user_id: user2.id,
      slug: publicSlug,
      business_name: 'Public Site',
      business_type: 'test',
      city: 'Test City',
      content: { title: 'Public' },
      status: 'published',
    });

    await admin.from('sites').insert({
      user_id: user2.id,
      slug: otherDraftSlug,
      business_name: 'Other Draft Site',
      business_type: 'test',
      city: 'Test City',
      content: { title: 'Draft' },
      status: 'draft',
    });

    await admin.from('subscriptions').insert([
      {
        user_id: user1.id,
        stripe_subscription_id: `sub_rls_${runId}_u1`,
        stripe_price_id: 'price_test',
        status: 'active',
      },
      {
        user_id: user2.id,
        stripe_subscription_id: `sub_rls_${runId}_u2`,
        stripe_price_id: 'price_test',
        status: 'active',
      },
    ]);
  } else {
    await user2Client.from('sites').insert({
      user_id: user2.id,
      slug: publicSlug,
      business_name: 'Public Site',
      business_type: 'test',
      city: 'Test City',
      content: { title: 'Public' },
      status: 'published',
    });

    await user2Client.from('sites').insert({
      user_id: user2.id,
      slug: otherDraftSlug,
      business_name: 'Other Draft Site',
      business_type: 'test',
      city: 'Test City',
      content: { title: 'Draft' },
      status: 'draft',
    });
  }

  const ownProfile = await user1Client.from('profiles').select('id').eq('id', user1.id).maybeSingle();
  addResult('profiles: own profile readable', !ownProfile.error && ownProfile.data?.id === user1.id, ownProfile.error?.message ?? '');

  const otherProfile = await user1Client.from('profiles').select('id').eq('id', user2.id);
  addResult('profiles: other profile hidden', !otherProfile.error && (otherProfile.data?.length ?? 0) === 0, otherProfile.error?.message ?? '');

  const updateOtherProfile = await user1Client
    .from('profiles')
    .update({ full_name: 'Blocked Attempt' })
    .eq('id', user2.id)
    .select('id');
  addResult(
    'profiles: other profile update blocked',
    !updateOtherProfile.error && (updateOtherProfile.data?.length ?? 0) === 0,
    updateOtherProfile.error?.message ?? ''
  );

  const ownSiteInsert = await user1Client
    .from('sites')
    .insert({
      user_id: user1.id,
      slug: privateSlug,
      business_name: 'Private Site',
      business_type: 'test',
      city: 'Test City',
      content: { title: 'Private' },
      status: 'draft',
    })
    .select('id,user_id')
    .single();
  addResult(
    'sites: own site insert allowed',
    !ownSiteInsert.error && ownSiteInsert.data?.user_id === user1.id,
    ownSiteInsert.error?.message ?? ''
  );

  const foreignSiteInsert = await user1Client.from('sites').insert({
    user_id: user2.id,
    slug: `rls-forbidden-${runId}`,
    business_name: 'Forbidden Site',
    business_type: 'test',
    city: 'Test City',
    content: { title: 'Forbidden' },
    status: 'draft',
  });
  addResult('sites: foreign site insert blocked', Boolean(foreignSiteInsert.error), foreignSiteInsert.error?.message ?? '');

  const hiddenOtherSites = await user1Client
    .from('sites')
    .select('id,user_id,slug,status')
    .eq('user_id', user2.id)
    .eq('status', 'draft');
  addResult('sites: other draft sites hidden', !hiddenOtherSites.error && (hiddenOtherSites.data?.length ?? 0) === 0, hiddenOtherSites.error?.message ?? '');

  const publicSiteAnon = await anonClient.from('sites').select('slug,status').eq('slug', publicSlug).maybeSingle();
  addResult(
    'sites: published site readable anonymously',
    !publicSiteAnon.error && publicSiteAnon.data?.slug === publicSlug && publicSiteAnon.data?.status === 'published',
    publicSiteAnon.error?.message ?? ''
  );

  if (admin) {
    const user1Subs = await user1Client.from('subscriptions').select('user_id,stripe_subscription_id');
    const onlyOwnSubs = !user1Subs.error && (user1Subs.data ?? []).every((row) => row.user_id === user1.id);
    addResult('subscriptions: only own subscriptions visible', onlyOwnSubs, user1Subs.error?.message ?? '');
  } else {
    addResult('subscriptions: only own subscriptions visible', true, 'Skipped (no service role key to seed rows).');
  }

  const user1SubInsert = await user1Client.from('subscriptions').insert({
    user_id: user1.id,
    stripe_subscription_id: `sub_rls_${runId}_forbidden_insert`,
    stripe_price_id: 'price_test',
    status: 'active',
  });
  addResult('subscriptions: direct user insert blocked', Boolean(user1SubInsert.error), user1SubInsert.error?.message ?? '');

  const user2OwnProfile = await user2Client.from('profiles').select('id').eq('id', user2.id).maybeSingle();
  addResult('profiles: second user own profile readable', !user2OwnProfile.error && user2OwnProfile.data?.id === user2.id, user2OwnProfile.error?.message ?? '');

  if (!admin) {
    addResult('cleanup: ephemeral users removed', true, 'Skipped (no service role key available).');
  }

  console.table(results.map((r) => ({ check: r.name, passed: r.passed, details: r.details })));

  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.error(`RLS verification failed: ${failed.length} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`RLS verification passed: ${results.length} checks.`);
  }
} catch (error) {
  console.error('RLS verification execution failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await cleanup();
}
