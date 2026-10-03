import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { unsafeHandleApiResponse } from "../src/lib/propertyBoundary";
import { propertyListingSchema } from "../src/lib/propertySchema";

const examples = [
  {
    name: "Example A",
    file: "examples/faulty-listing-a.json",
  },
  {
    name: "Example B",
    file: "examples/faulty-listing-b.json",
  },
];

for (const example of examples) {
  const responseBody = readFileSync(
    resolve(process.cwd(), example.file),
    "utf8",
  );

  try {
    const output = unsafeHandleApiResponse(responseBody);
    console.log(`${example.name} unsafe result: ACCEPTED`);
    console.log(output);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.log(`${example.name} unsafe result: CRASHED`);
    console.log(message);
  }

  const payload: unknown = JSON.parse(responseBody);
  const result = propertyListingSchema.safeParse(payload);

  if (result.success) {
    console.log(`${example.name} validation result: ACCEPTED`);
  } else {
    console.log(`${example.name} validation result: REJECTED`);

    for (const issue of result.error.issues) {
      console.log(`- ${issue.path.join(".")}: ${issue.message}`);
    }
  }

  console.log();
}
