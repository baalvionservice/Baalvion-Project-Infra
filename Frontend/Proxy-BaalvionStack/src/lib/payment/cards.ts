/**
 * Pure client-side card utilities — formatting, brand detection, and validation.
 *
 * SECURITY: these helpers run ENTIRELY in the browser for UX + inline validation
 * only. Raw card numbers / CVV are NEVER serialised to our backend. The actual
 * charge goes through the provider's tokenized/hosted flow (Stripe Elements /
 * Razorpay Checkout) via `startGatewayCheckout()`. In production the number/CVV
 * inputs are replaced by the provider's hosted fields and these utilities are
 * used purely for the optimistic local form experience.
 *
 * `new Date()` is intentionally used here (client clock) since this is a
 * cosmetic, browser-only validation step — the authoritative expiry check
 * happens at the payment provider.
 */

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "rupay" | "unknown";

const MIN_CARD_DIGITS = 12;
const MAX_DIGITS_DEFAULT = 16;
const MAX_DIGITS_AMEX = 15;

/** Strip everything but digits. */
function digitsOnly(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

/**
 * Detect the card brand from the leading digits.
 *   visa       ^4
 *   mastercard ^5[1-5] | ^2[2-7]
 *   amex       ^3[47]
 *   discover   ^6(011 | 5 | 4[4-9])
 *   rupay      ^(60 | 65 | 81 | 82 | 508)
 */
export function detectBrand(raw: string): CardBrand {
  const d = digitsOnly(raw);
  if (!d) return "unknown";
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^6(011|5|4[4-9])/.test(d)) return "discover";
  if (/^(60|65|81|82|508)/.test(d)) return "rupay";
  return "unknown";
}

/** Amex uses a 4-digit CVV ("CID"); every other brand uses 3. */
export function cvvLength(brand: CardBrand): number {
  return brand === "amex" ? 4 : 3;
}

/**
 * Format a raw card number for display: strip non-digits, cap length per brand
 * (amex 15, else 16), and group digits (amex 4-6-5, else groups of 4).
 */
export function formatCardNumber(raw: string): string {
  const brand = detectBrand(raw);
  const isAmex = brand === "amex";
  const max = isAmex ? MAX_DIGITS_AMEX : MAX_DIGITS_DEFAULT;
  const d = digitsOnly(raw).slice(0, max);
  if (!d) return "";

  if (isAmex) {
    // 4-6-5 grouping
    const parts = [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean);
    return parts.join(" ");
  }
  // groups of 4
  return (d.match(/.{1,4}/g) ?? []).join(" ");
}

/** Luhn checksum over the digits. Requires at least 12 digits. */
export function luhnValid(raw: string): boolean {
  const d = digitsOnly(raw);
  if (d.length < MIN_CARD_DIGITS) return false;

  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = Number(d[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Format raw expiry digits as "MM/YY". */
export function formatExpiry(raw: string): string {
  const d = digitsOnly(raw).slice(0, 4);
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

/**
 * Validate an "MM/YY" expiry: month 1-12 and not in the past. The card is valid
 * through the END of the expiry month, so we compare against the last instant
 * of that month.
 */
export function expiryValid(value: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec((value || "").trim());
  if (!m) return false;

  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;

  // Last instant of the expiry month: day 0 of the NEXT month = last day of this one.
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  return endOfMonth.getTime() >= Date.now();
}

export interface CardInput {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
  country: string;
  postal: string;
}

/**
 * Validate a card form, returning a map of field -> human-readable error message.
 * An empty object means the form is valid. (Postal is collected but optional —
 * the provider re-validates AVS during the hosted charge.)
 */
export function validateCard(c: CardInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const brand = detectBrand(c.number);

  if (!c.name.trim()) {
    errors.name = "Cardholder name is required.";
  }

  const numberDigits = digitsOnly(c.number);
  if (numberDigits.length < MIN_CARD_DIGITS || !luhnValid(c.number)) {
    errors.number = "Enter a complete, valid card number.";
  }

  if (!expiryValid(c.expiry)) {
    errors.expiry = "Enter a valid, unexpired date (MM/YY).";
  }

  const expectedCvv = cvvLength(brand);
  if (digitsOnly(c.cvv).length !== expectedCvv) {
    errors.cvv = `CVV must be ${expectedCvv} digits.`;
  }

  if (!c.country.trim()) {
    errors.country = "Billing country is required.";
  }

  return errors;
}
