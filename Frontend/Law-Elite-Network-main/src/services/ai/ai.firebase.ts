// Firebase removed from this project. USE_MOCK is permanently true, so these
// symbols are never invoked — this shim only keeps the legacy facade import
// resolving with ZERO Firebase code. Safe to delete once facades drop USE_MOCK.
const removed = (..._args: any[]): any => { throw new Error('Firebase removed — use the mock/REST implementation.'); };
export const firebaseGetCachedInsights = removed;
export const firebaseGetDocumentInsights = removed;
export const firebaseSaveDocumentInsights = removed;
export const firebaseSaveInsights = removed;
