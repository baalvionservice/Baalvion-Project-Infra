/** Join class names, dropping falsy entries. Deliberately not `clsx` — this is
 *  the whole of what the package needs and avoids forcing a dependency on 22
 *  apps that already each ship their own variant. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
