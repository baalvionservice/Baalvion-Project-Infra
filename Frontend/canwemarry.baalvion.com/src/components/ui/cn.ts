/** Joins class names, dropping falsy entries. Kept local so the app pulls in no utility dependency. */
export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
