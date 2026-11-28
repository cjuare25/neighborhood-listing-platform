import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SponsorTimeoutError,
  withSponsorTimeout,
} from "./sponsor-timeout";

afterEach(() => {
  vi.useRealTimers();
});

describe("sponsor lookup timeout", () => {
  it("returns successful data and clears the timer", async () => {
    vi.useFakeTimers();

    await expect(
      withSponsorTimeout(async () => ({ name: "Demo sponsor" })),
    ).resolves.toEqual({ name: "Demo sponsor" });

    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves database failures and clears the timer", async () => {
    vi.useFakeTimers();
    const error = new Error("Database unavailable");

    await expect(
      withSponsorTimeout(async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(vi.getTimerCount()).toBe(0);
  });

  it("times out at 2500 ms and aborts an unresponsive operation", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const aborted = vi.fn();

    const result = withSponsorTimeout((receivedSignal) => {
      signal = receivedSignal;
      receivedSignal.addEventListener("abort", aborted);
      return new Promise<never>(() => {});
    });
    const assertion = expect(result).rejects.toBeInstanceOf(
      SponsorTimeoutError,
    );

    await vi.advanceTimersByTimeAsync(2499);
    expect(signal?.aborted).toBe(false);
    expect(aborted).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await assertion;

    expect(signal?.aborted).toBe(true);
    expect(aborted).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("handles an operation that throws before returning a promise", async () => {
    vi.useFakeTimers();

    await expect(
      withSponsorTimeout(() => {
        throw new Error("Could not start lookup");
      }),
    ).rejects.toThrow("Could not start lookup");

    expect(vi.getTimerCount()).toBe(0);
  });
});
