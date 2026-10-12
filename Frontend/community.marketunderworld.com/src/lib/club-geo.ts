// India or UAE for a venue. UAE venues are stored with the emirate as their state.
export const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"]
export type CountryKey = "India" | "United Arab Emirates"
export const countryOf = (state: string): CountryKey => (EMIRATES.includes(state) ? "United Arab Emirates" : "India")
export const COUNTRY_SHORT: Record<CountryKey, string> = { India: "India", "United Arab Emirates": "UAE" }

export function kmBetween(aLat: number, aLon: number, bLat: number, bLon: number) {
  const p = Math.PI / 180
  const x = Math.sin(((bLat - aLat) * p) / 2) ** 2 + Math.cos(aLat * p) * Math.cos(bLat * p) * Math.sin(((bLon - aLon) * p) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(x))
}
