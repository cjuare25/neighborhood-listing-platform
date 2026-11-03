import "server-only";

import { createClient } from "@supabase/supabase-js";

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};

function getPublicConfiguration() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  return { url, anonKey };
}

// Public queries remain subject to anonymous RLS policies.
export function createPublicSupabaseClient() {
  const { url, anonKey } = getPublicConfiguration();

  return createClient(url, anonKey, {
    auth: authOptions,
  });
}

// Each request receives a separate client with its user's access token.
// The route must verify the token with auth.getUser(accessToken).
export function createUserSupabaseClient(accessToken: string) {
  const { url, anonKey } = getPublicConfiguration();

  return createClient(url, anonKey, {
    auth: authOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// Trusted administrative code only.
// Any caller handling a user request must authorize the administrator
// before using this client. Ordinary listing routes must not use it.
export function createAdminSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase administrative configuration is missing.");
  }

  return createClient(url, serviceRoleKey, {
    auth: authOptions,
  });
}
