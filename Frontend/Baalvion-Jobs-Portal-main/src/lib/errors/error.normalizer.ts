export const normalizeError = (err: any) => ({
  message: err?.message || 'Unknown error',
  code: err?.code
});
