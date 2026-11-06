const suppliedUrl = process.argv[2] ?? process.env.DEPLOYMENT_URL;

if (!suppliedUrl) {
  console.error(
    "SMOKE_TEST_FAILED: provide a deployment URL argument or DEPLOYMENT_URL.",
  );
  process.exit(1);
}

let baseUrl;

try {
  baseUrl = new URL(suppliedUrl);
} catch {
  console.error(`SMOKE_TEST_FAILED: invalid deployment URL: ${suppliedUrl}`);
  process.exit(1);
}

async function requireResponse(path, description) {
  let response;

  try {
    response = await fetch(new URL(path, baseUrl), {
      redirect: "follow",
      headers: {
        Accept: path === "/api/health" ? "application/json" : "text/html",
      },
    });
  } catch (error) {
    console.error(
      `SMOKE_TEST_FAILED: ${description} could not be reached: ${error.message}`,
    );
    process.exit(1);
  }

  if (response.status !== 200) {
    console.error(
      `SMOKE_TEST_FAILED: ${description} returned HTTP ${response.status}; expected HTTP 200.`,
    );
    process.exit(1);
  }

  return response;
}

const healthResponse = await requireResponse(
  "/api/health",
  "health endpoint",
);

let healthBody;

try {
  healthBody = await healthResponse.json();
} catch {
  console.error("SMOKE_TEST_FAILED: health endpoint did not return JSON.");
  process.exit(1);
}

if (
  healthBody.status !== "ok" ||
  healthBody.service !== "neighborhood-listing-platform"
) {
  console.error(
    `SMOKE_TEST_FAILED: unexpected health response: ${JSON.stringify(healthBody)}`,
  );
  process.exit(1);
}

const homeResponse = await requireResponse("/", "home page");
const homeBody = await homeResponse.text();

if (!homeBody.includes("Neighborhood Property Listings")) {
  console.error(
    "SMOKE_TEST_FAILED: home page is missing the expected application heading.",
  );
  process.exit(1);
}

console.log(
  `SMOKE_TEST_PASSED: ${baseUrl.origin} returned HTTP 200 for /api/health and /.`,
);