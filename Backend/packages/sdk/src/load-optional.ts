/**
 * Load an optional peer package at runtime.
 *
 * The specifier is a VARIABLE, so the TypeScript compiler does not statically
 * resolve it — the SDK type-checks and builds **in isolation** without the
 * `@baalvion/*` peers present, and binds to them at runtime inside a consuming
 * service. Mirrors the platform's established optional-lib pattern
 * (see @baalvion/service-kit, @baalvion/events).
 */
export async function loadOptional<T = unknown>(name: string): Promise<T | null> {
  try {
    const spec = name; // variable → not statically analysed by tsc/esbuild
    return (await import(spec)) as T;
  } catch {
    return null;
  }
}
