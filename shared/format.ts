/**
 * Celobrojni iznos sa tačkom kao separatorom hiljada (srpski zapis): 30000 → „30.000“.
 * Namerno bez `Intl`: rezultat mora biti isti pri prerenderu (Node) i u svakom browseru.
 */
export function formatThousands(value: number): string {
  return Math.trunc(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
