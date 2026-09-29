/**
 * Ambient typings for the Razorpay Checkout script
 * (https://checkout.razorpay.com/v1/checkout.js).
 *
 * The script attaches a global `Razorpay` constructor to `window` once loaded.
 * We model only the surface the storefront consumes: standard order-based
 * checkout with a verified handler callback and a dismiss hook. The HMAC
 * signature returned in the handler is verified SERVER-SIDE on confirm — the
 * client never marks itself paid.
 */

/** Result handed to the Razorpay `handler` after a successful charge. */
export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/** Options accepted by `new window.Razorpay(opts)`. */
export interface RazorpayOptions {
  /** Public key id (`rzp_test_...` / `rzp_live_...`). */
  key: string;
  /** Razorpay order id (`order_...`) created server-side. */
  order_id: string;
  /** Amount in minor units (paise) — must match the server-created order. */
  amount: number;
  /** ISO 4217 currency (e.g. "INR"). */
  currency: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  /** Invoked with the signed payment result on a successful charge. */
  handler?: (response: RazorpayHandlerResponse) => void | Promise<void>;
  modal?: {
    /** Invoked when the shopper dismisses the popup without paying. */
    ondismiss?: () => void;
  };
}

/** The checkout instance returned by `new window.Razorpay(opts)`. */
export interface RazorpayInstance {
  open(): void;
  on?(event: string, callback: () => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export {};
