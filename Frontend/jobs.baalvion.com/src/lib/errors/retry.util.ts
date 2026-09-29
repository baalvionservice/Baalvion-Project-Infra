export const retry = async (fn: () => Promise<any>, attempts = 3) => {
  let last;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) { last = e; }
  }
  throw last;
};
