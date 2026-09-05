export class BodyError extends Error {
  constructor(public status: number) { super("Invalid request body"); }
}

export async function readBoundedBody(request: Request, maximum = 16_384, deadlineMs = 8_000): Promise<string> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new BodyError(408));
      void reader.cancel().catch(() => undefined);
    }, deadlineMs);
  });
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        void reader.cancel().catch(() => undefined);
        throw new BodyError(413);
      }
      chunks.push(value);
    }
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
