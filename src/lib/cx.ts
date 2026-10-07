/** Spaja CSS klase i preskače prazne vrednosti. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
