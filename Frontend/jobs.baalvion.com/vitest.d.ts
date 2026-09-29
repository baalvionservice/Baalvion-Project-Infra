// Makes Vitest's global APIs (describe/test/expect/vi …) known to TypeScript
// without restricting `compilerOptions.types`. Required because the Vitest
// config sets `globals: true`.
/// <reference types="vitest/globals" />
