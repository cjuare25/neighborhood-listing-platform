import { describe, expect, it } from "vitest";
import { propertySchema } from "./property";

const validProperty = {
  address: "125 Maple Street",
  price: 725000,
  bedrooms: 3,
  bathrooms: 2.5,
  square_feet: 1500,
};

describe("property submission contract", () => {
  it("accepts a complete valid listing", () => {
    expect(propertySchema.safeParse(validProperty).success).toBe(true);
  });

  it("allows zero price, bedrooms, and bathrooms", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
    });
    expect(result.success).toBe(true);
  });

  it.each([
    { status: "approved" },
    { owner_id: "another-users-id" },
    { id: "client-selected-id" },
    { unexpected: true },
  ])("rejects extra fields: %j", (extra) => {
    const result = propertySchema.safeParse({
      ...validProperty,
      ...extra,
    });
    expect(result.success).toBe(false);
  });

  it.each([
    { address: "    " },
    { price: -1 },
    { price: "725000" },
    { bedrooms: 1.5 },
    { bathrooms: -1 },
    { square_feet: 0 },
    { square_feet: 100.5 },
    { price: 10000000000 },
    { bathrooms: 100 },
    { square_feet: 2147483648 },
  ])("rejects invalid field values: %j", (invalid) => {
    const result = propertySchema.safeParse({
      ...validProperty,
      ...invalid,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const result = propertySchema.safeParse({
      address: validProperty.address,
      price: validProperty.price,
      bedrooms: validProperty.bedrooms,
      bathrooms: validProperty.bathrooms,
    });
    expect(result.success).toBe(false);
  });
});
