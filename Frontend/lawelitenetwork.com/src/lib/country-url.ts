export function countryUrl(code: string): string {
  return `/countries/${code.toLowerCase()}`;
}
