/** Join class names, skipping falsy values (Untitled UI–compatible helper). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
