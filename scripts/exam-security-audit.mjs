import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error("Missing required Supabase environment variables.");
}

const options = {
  auth: { persistSession: false, autoRefreshToken: false },
};
const admin = createClient(url, serviceKey, options);
const anonymous = createClient(url, anonKey, options);
const userIds = [];
const sponsorIds = [];
const results = [];
const runId = randomUUID();
const propertyIds = [randomUUID(), randomUUID(), randomUUID()];
const [draftA, draftB, approvedA] = propertyIds;

function checked(result, label) {
  if (result.error) {
    throw new Error(
      `${label}: ${result.error.code ?? result.error.status ?? "request failed"}`,
    );
  }
  return result.data;
}

async function test(label, action) {
  try {
    await action();
    results.push([label, "PASS"]);
    console.log(`PASS: ${label}`);
  } catch (error) {
    results.push([label, "FAIL"]);
    throw error;
  }
}

async function actor(label, role) {
  const email = `exam-${label}-${runId}@example.com`;
  const password = `Exam!9aA-${randomUUID()}`;

  const created = checked(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    }),
    "Create temporary account",
  );
  const id = created.user.id;
  userIds.push(id);

  checked(
    await admin.from("profiles").insert({ id, role }),
    "Create temporary profile",
  );

  const client = createClient(url, anonKey, options);
  const signedIn = checked(
    await client.auth.signInWithPassword({ email, password }),
    "Sign in temporary account",
  );
  assert.ok(signedIn.session, "Sign-in must return a session.");

  return { id, client, token: signedIn.session.access_token };
}

try {
  const ownerA = await actor("owner-a", "property_owner");
  const ownerB = await actor("owner-b", "property_owner");
  const inquirer = await actor("inquirer", "public");

  const sponsors = [
    {
      id: randomUUID(),
      name: "Exam Active Sponsor",
      tier: "gold",
      active_status: true,
    },
    {
      id: randomUUID(),
      name: "Exam Inactive Sponsor",
      tier: "bronze",
      active_status: false,
    },
  ];

  checked(await admin.from("sponsors").insert(sponsors), "Create sponsors");
  sponsorIds.push(...sponsors.map((sponsor) => sponsor.id));

  checked(
    await admin.from("properties").insert([
      {
        id: draftA,
        owner_id: ownerA.id,
        address: `Exam draft A ${runId}`,
        price: 100000,
        bedrooms: 2,
        bathrooms: 1,
        square_feet: 1000,
        status: "draft",
      },
      {
        id: draftB,
        owner_id: ownerB.id,
        address: `Exam draft B ${runId}`,
        price: 200000,
        bedrooms: 2,
        bathrooms: 1,
        square_feet: 1000,
        status: "draft",
      },
      {
        id: approvedA,
        owner_id: ownerA.id,
        address: `Exam approved A ${runId}`,
        price: 300000,
        bedrooms: 3,
        bathrooms: 2,
        square_feet: 1500,
        status: "approved",
      },
    ]),
    "Create property fixtures",
  );

  checked(
    await admin.from("property_sponsors").insert(
      sponsorIds.map((sponsor_id) => ({
        property_id: approvedA,
        sponsor_id,
      })),
    ),
    "Create sponsor associations",
  );

  checked(
    await admin.from("inquiries").insert({
      property_id: draftB,
      inquirer_email: "exam-other@example.com",
      message: "This inquiry belongs to Owner B.",
    }),
    "Create private inquiry fixture",
  );

  await test("Admin can insert and read across all five tables", async () => {
    for (const table of [
      "profiles", "sponsors", "properties", "property_sponsors", "inquiries",
    ]) {
      const response = await admin
        .from(table)
        .select("*", { count: "exact", head: true });
      checked(response, `Admin read ${table}`);
      assert.ok(response.count > 0);
    }
  });

  await test("Anonymous approved read allowed; draft reads denied", async () => {
    const rows = checked(
      await anonymous.from("properties").select("id").in("id", propertyIds),
      "Anonymous property read",
    );
    assert.deepEqual(rows.map((row) => row.id), [approvedA]);
  });

  await test("Anonymous sponsor reads expose only active sponsors", async () => {
    const rows = checked(
      await anonymous.from("sponsors").select("id").in("id", sponsorIds),
      "Anonymous sponsor read",
    );
    assert.deepEqual(rows.map((row) => row.id), [sponsorIds[0]]);
  });

  await test("Public associations hide inactive sponsors", async () => {
    const rows = checked(
      await anonymous.from("property_sponsors")
        .select("sponsor_id").eq("property_id", approvedA),
      "Public association read",
    );
    assert.deepEqual(rows.map((row) => row.sponsor_id), [sponsorIds[0]]);
  });

  await test("Owner A can update Owner A draft", async () => {
    const rows = checked(
      await ownerA.client.from("properties").update({ price: 123456 })
        .eq("id", draftA).select("id, price"),
      "Own draft update",
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].price, 123456);
  });

  await test("Owner A cannot update Owner B listing", async () => {
    const rows = checked(
      await ownerA.client.from("properties").update({ price: 1 })
        .eq("id", draftB).select("id"),
      "Other owner update",
    );
    assert.equal(rows.length, 0);

    const saved = checked(
      await admin.from("properties").select("price")
        .eq("id", draftB).single(),
      "Verify other owner property",
    );
    assert.equal(saved.price, 200000);
  });

  await test("Owner cannot edit an approved listing", async () => {
    const rows = checked(
      await ownerA.client.from("properties").update({ price: 1 })
        .eq("id", approvedA).select("id"),
      "Approved listing update",
    );
    assert.equal(rows.length, 0);
  });

  await test("Owner cannot approve their own draft", async () => {
    const response = await ownerA.client.from("properties")
      .update({ status: "approved" }).eq("id", draftA);
    assert.equal(response.error?.code, "42501");
  });

  await test("User cannot grant themselves an admin profile", async () => {
    const response = await inquirer.client.from("profiles")
      .update({ role: "admin" }).eq("id", inquirer.id);
    assert.equal(response.error?.code, "42501");
  });

  await test("Anonymous and authenticated inquirers can submit inquiries", async () => {
    for (const client of [anonymous, inquirer.client]) {
      checked(
        await client.from("inquiries").insert({
          property_id: approvedA,
          inquirer_email: "exam-inquirer@example.com",
          message: "Please provide more information about this property.",
        }),
        "Submit inquiry",
      );
    }

    const rows = checked(
      await admin.from("inquiries").select("id")
        .eq("property_id", approvedA),
      "Verify persisted inquiries",
    );
    assert.equal(rows.length, 2);
  });

  await test("Anonymous users cannot select inquiries", async () => {
    const response = await anonymous.from("inquiries").select("id");
    assert.equal(response.error?.code, "42501");
  });

  await test("Authenticated public inquirer cannot read existing inquiries", async () => {
    const rows = checked(
      await inquirer.client.from("inquiries").select("id")
        .in("property_id", propertyIds),
      "Inquirer privacy check",
    );
    assert.equal(rows.length, 0);
  });

  await test("Owner A sees only inquiries for Owner A properties", async () => {
    const rows = checked(
      await ownerA.client.from("inquiries").select("property_id")
        .in("property_id", propertyIds),
      "Owner inquiry visibility",
    );
    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row.property_id === approvedA));
  });

  await test("Authenticated API POST persists an owner-linked draft with HTTP 201", async () => {
    const response = await fetch("http://localhost:3000/api/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerA.token}`,
      },
      body: JSON.stringify({
        address: `Exam API submission ${runId}`,
        price: 250000,
        bedrooms: 2,
        bathrooms: 1.5,
        square_feet: 1200,
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.data.owner_id, ownerA.id);
    assert.equal(body.data.status, "draft");

    const saved = checked(
      await admin.from("properties").select("owner_id, status")
        .eq("id", body.data.id).single(),
      "Verify API persistence",
    );
    assert.equal(saved.owner_id, ownerA.id);
    assert.equal(saved.status, "draft");
  });

  await test("Public API includes approved sponsored fixture and excludes drafts", async () => {
    const response = await fetch("http://localhost:3000/api/properties");
    assert.equal(response.status, 200);
    const body = await response.json();
    const listing = body.data.find((row) => row.id === approvedA);
    assert.ok(listing);
    assert.deepEqual(
      Object.keys(listing).sort(),
      ["id", "address", "price", "bedrooms", "bathrooms", "square_feet", "sponsors"].sort(),
    );
    assert.deepEqual(listing.sponsors.map((sponsor) => sponsor.id), [sponsorIds[0]]);
    assert.ok(!body.data.some((row) => row.id === draftA || row.id === draftB));
  });
} catch (error) {
  if (!results.some(([, result]) => result === "FAIL")) {
    results.push(["Fixture setup or audit execution", "FAIL"]);
  }
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  const cleanupErrors = [];

  async function cleanup(label, operation) {
    try {
      const response = await operation();
      if (response.error) throw new Error("Cleanup request failed.");
    } catch {
      cleanupErrors.push(label);
    }
  }

  for (const id of userIds) {
    await cleanup(`Properties for test user ${id}`, () =>
      admin.from("properties").delete().eq("owner_id", id));
  }

  if (sponsorIds.length) {
    await cleanup("Test sponsors", () =>
      admin.from("sponsors").delete().in("id", sponsorIds));
  }

  for (const id of userIds) {
    await cleanup(`Test account ${id}`, () => admin.auth.admin.deleteUser(id));
  }

  results.push(["Temporary fixture cleanup", cleanupErrors.length ? "FAIL" : "PASS"]);

  if (cleanupErrors.length) {
    process.exitCode = 1;
    console.error("Cleanup needs attention:", cleanupErrors.join("; "));
  } else {
    console.log("PASS: Temporary fixture cleanup");
  }

  await mkdir("docs", { recursive: true });
  await writeFile(
    "docs/security-audit.md",
    [
      "# Examination Security Audit",
      "",
      `Execution time (UTC): ${new Date().toISOString()}`,
      "",
      "Runner: scripts/exam-security-audit.mjs",
      "Tests use temporary accounts and records in the configured Supabase project.",
      "User operations use anonymous or authenticated clients; administrative",
      "setup, verification, and cleanup use a separate service-role client.",
      "Only listed checks were executed. A failure may stop later checks.",
      "",
      "| Check | Observed result |",
      "| :--- | :--- |",
      ...results.map(([label, result]) => `| ${label} | ${result} |`),
      "",
      "## Previously verified HTTP smoke checks",
      "",
      "- Public GET returned HTTP 200.",
      "- POST with an extra status field returned HTTP 400 and structured details.",
      "- Valid POST without authentication returned HTTP 401.",
      "- Malformed JSON returned HTTP 400.",
      "",
      "## Dependency verification",
      "",
      "- Next.js updated to 16.4.4.",
      "- Production dependency audit reported zero vulnerabilities.",
      "- Full dependency audit still reported 16 moderate development-tool findings.",
      "",
      ...(cleanupErrors.length
        ? ["## Cleanup requiring attention", "", ...cleanupErrors.map((item) => `- ${item}`)]
        : []),
      "",
    ].join("\n"),
  );

  console.log("Saved docs/security-audit.md");
}
