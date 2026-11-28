export const SPONSOR_TIMEOUT_MS = 2500;

export class SponsorTimeoutError extends Error {
  constructor() {
    super("Sponsor lookup exceeded its time budget.");
    this.name = "SponsorTimeoutError";
  }
}

export async function withSponsorTimeout<T>(
  operation: (signal: AbortSignal) => PromiseLike<T>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new SponsorTimeoutError();
      reject(error);
      controller.abort(error);
    }, SPONSOR_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}
