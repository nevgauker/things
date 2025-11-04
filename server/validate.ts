// Tiny wrapper to use Zod when available, otherwise fallback to a permissive stub
// This keeps local builds working without adding a hard dependency.
// In production, install `zod` to get real validation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const z: any = (() => {
  try {
    // Avoid bundler static resolution
    // eslint-disable-next-line no-eval
    const dynamicRequire: NodeRequire = eval('require');
    return dynamicRequire('zod');
  } catch {
    const chain = (self: any) => ({
      email: () => self,
      min: () => self,
      max: () => self,
      length: () => self,
      optional: () => self,
      nonnegative: () => self,
      gte: () => self,
      lte: () => self,
    });
    const string = () => chain({});
    const number = () => chain({});
    return {
      string,
      number,
      coerce: { number },
      enum: (_vals: string[]) => ({ optional: () => ({}) }),
      object: (_shape: Record<string, unknown>) => ({
        safeParse: (payload: unknown) => ({ success: true, data: payload }),
      }),
    };
  }
})();

