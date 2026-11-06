const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !publishableKey) {
  console.error(
    "RLS_GATE_FAILED: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.",
  );
  process.exit(1);
}

const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/properties?id=eq.00000000-0000-0000-0000-000000000000`;

const response = await fetch(endpoint, {
  method: "DELETE",
  headers: {
    apikey: publishableKey,
    Accept: "application/json",
  },
});

const responseText = await response.text();

let responseBody;

try {
  responseBody = JSON.parse(responseText);
} catch {
  responseBody = {};
}

const accessWasBlocked =
  (response.status === 401 || response.status === 403) &&
  responseBody.code === "42501";

if (!accessWasBlocked) {
  console.error(
    `RLS_GATE_FAILED: anonymous DELETE was not blocked as expected. HTTP ${response.status}.`,
  );
  console.error(responseText);
  process.exit(1);
}

console.log(
  `RLS_GATE_PASSED: anonymous DELETE blocked with HTTP ${response.status} and PostgreSQL code ${responseBody.code}.`,
);