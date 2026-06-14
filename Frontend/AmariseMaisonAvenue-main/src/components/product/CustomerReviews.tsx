"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  countryToLocale,
  normalizeCountry,
} from "@/lib/i18n/countries";
import type { CountryCode } from "@/lib/types";
import type { PublicReview, ReviewsPage } from "@/lib/catalog";
import { getProductReviews } from "@/lib/catalog";
import {
  authClient,
  getCurrentUser,
  type AmariseUser,
} from "@/lib/auth";
import { reviewApi, type ProductReview } from "@/lib/api-client";

// ─── Props ──────────────────────────────────────────────────────────────────
interface CustomerReviewsProps {
  /** Product these reviews belong to. */
  productId: string;
  /** Active market — drives the date locale + the sign-in link. */
  country?: CountryCode | string;
  /**
   * Approved reviews fetched server-side (preferred, SSR-friendly). When absent,
   * the component fetches the first page itself on mount.
   */
  initialReviews?: ReviewsPage;
  /**
   * Server-computed aggregate over ALL approved reviews (C4) — the PDP passes the product's
   * server `rating` / `reviewsCount`. The header renders from these (not a page-scoped client
   * mean) so the "X.X · N reviews" line is consistent regardless of how many pages are loaded.
   */
  ratingAverage?: number;
  ratingCount?: number;
}

const MIN_RATING = 1;
const MAX_RATING = 5;
const BODY_MAX = 4000;
const TITLE_MAX = 120;

// ─── Stars (read-only, accessible) ────────────────────────────────────────────
function Stars({ count }: { count: number }) {
  const rounded = Math.max(0, Math.min(MAX_RATING, Math.round(count)));
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${rounded} out of ${MAX_RATING} stars`}
    >
      {Array.from({ length: MAX_RATING }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          strokeWidth={1.5}
          className={cn(
            "w-4 h-4",
            i < rounded
              ? "fill-gray-900 text-gray-900"
              : "fill-transparent text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

// ─── Date — rendered in the active market's locale ────────────────────────────
function formatReviewDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

// ─── Single Review Card ───────────────────────────────────────────────────────
function ReviewCard({
  review,
  locale,
}: {
  review: PublicReview;
  locale: string;
}) {
  const date = formatReviewDate(review.createdAt, locale);
  return (
    <article className="flex flex-col gap-3">
      <Stars count={review.rating} />

      {review.title && (
        <h3 className="text-[13px] font-bold tracking-wide text-gray-900 leading-snug uppercase">
          {review.title}
        </h3>
      )}

      {review.body && (
        <p className="text-[14px] text-gray-700 leading-relaxed font-normal whitespace-pre-line">
          {review.body}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[12px] font-bold tracking-[0.2em] text-gray-900">
          - {review.author}
        </span>
        {review.isVerifiedPurchase && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-cream px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-gray-700">
            Verified Purchase
          </span>
        )}
        {date && (
          <span className="text-[11px] tracking-wide text-gray-400">{date}</span>
        )}
      </div>

      {review.reply && (
        <div className="mt-1 border-l-2 border-gray-200 pl-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Maison Avenue Response
            {review.replyAt && (
              <span className="ml-2 font-normal tracking-wide text-gray-400">
                {formatReviewDate(review.replyAt, locale)}
              </span>
            )}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600 whitespace-pre-line">
            {review.reply}
          </p>
        </div>
      )}
    </article>
  );
}

// ─── Interactive star input (accessible) ──────────────────────────────────────
function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Your rating"
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: MAX_RATING }).map((_, i) => {
        const rating = i + 1;
        const active = rating <= shown;
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
            disabled={disabled}
            onMouseEnter={() => setHover(rating)}
            onFocus={() => setHover(rating)}
            onClick={() => onChange(rating)}
            className={cn(
              "p-0.5 transition-transform focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-900",
              !disabled && "hover:scale-110",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <Star
              aria-hidden="true"
              strokeWidth={1.5}
              className={cn(
                "w-6 h-6",
                active
                  ? "fill-gray-900 text-gray-900"
                  : "fill-transparent text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Map a backend ProductReview (authed write shape) to the public read shape. */
function toPublicReview(r: ProductReview): PublicReview {
  return {
    id: r.id,
    rating: r.rating,
    title: r.title ?? null,
    body: r.body ?? null,
    author: r.author,
    isVerifiedPurchase: r.isVerifiedPurchase,
    createdAt: r.createdAt,
    reply: r.reply ?? null,
    replyAt: r.replyAt ?? null,
  };
}

// ─── Write Review Form ────────────────────────────────────────────────────────
function WriteReviewForm({
  productId,
  countryCode,
  applyOptimistic,
  reconcile,
}: {
  productId: string;
  countryCode: CountryCode;
  /**
   * Apply the optimistic review to the list (upsert by id) and return a closure
   * that restores the exact prior list — call it to roll back on failure.
   */
  applyOptimistic: (review: PublicReview) => () => void;
  /** Replace the optimistic entry with the canonical server review. */
  reconcile: (optimisticId: string, canonical: PublicReview) => void;
}) {
  // Auth detection: the product page is NOT wrapped in <AuthProvider>, so we read
  // the real session straight from lib/auth (the same source AuthProvider builds on)
  // and silently restore it from the httpOnly refresh cookie on mount.
  const [user, setUser] = useState<AmariseUser | null>(() => getCurrentUser());
  const [authChecked, setAuthChecked] = useState(false);

  const [existingId, setExistingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Restore session, then prefill from any existing review (edit mode).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let current = getCurrentUser();
      if (!current) current = await authClient.bootstrap();
      if (cancelled) return;
      setUser(current);
      if (current) {
        const res = await reviewApi.mine(productId);
        if (cancelled) return;
        if (res.ok && res.data) {
          setExistingId(res.data.id);
          setRating(res.data.rating);
          setTitle(res.data.title ?? "");
          setBody(res.data.body ?? "");
        }
      }
      if (!cancelled) setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (rating < MIN_RATING || rating > MAX_RATING) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }
    if (!user) {
      setError("Please sign in to share your experience.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    // Optimistic review reflected in the list immediately; the returned closure
    // restores the exact prior list verbatim if the write fails.
    const optimistic: PublicReview = {
      id: existingId ?? `optimistic-${Date.now()}`,
      rating,
      title: trimmedTitle || null,
      body: trimmedBody || null,
      author: user.name?.trim() || "You",
      isVerifiedPurchase: false, // server-authoritative; corrected on the next load
      createdAt: new Date().toISOString(),
      reply: null,
      replyAt: null,
    };
    const rollback = applyOptimistic(optimistic);

    setSubmitting(true);
    try {
      const res = await reviewApi.submit(productId, {
        rating,
        title: trimmedTitle || undefined,
        body: trimmedBody || undefined,
      });
      if (!res.ok) {
        rollback();
        setError(res.error.message || "We could not save your review. Please try again.");
        return;
      }
      // Reconcile with the canonical server review (real id + verified-purchase flag).
      const canonical = toPublicReview(res.data);
      reconcile(optimistic.id, canonical);
      setExistingId(res.data.id);
      setSuccess(
        res.data.status === "pending"
          ? "Thank you — your review has been submitted for approval."
          : "Thank you — your review has been published."
      );
    } catch (err: unknown) {
      rollback();
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Session not resolved yet — avoid flashing the wrong state.
  if (!authChecked) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-gray-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    );
  }

  // Signed-out — tasteful prompt linking to the country's account login.
  if (!user) {
    return (
      <div className="border border-gray-200 bg-cream/40 px-6 py-8 text-center">
        <p className="text-[14px] font-serif text-gray-800">
          Share your experience with this artifact.
        </p>
        <Link
          href={`/${countryCode}/account/login?redirect=/${countryCode}/product/${productId}`}
          className="mt-4 inline-block border border-gray-900 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
        >
          Sign in to write a review
        </Link>
      </div>
    );
  }

  const isEditing = existingId !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-gray-900">
        {isEditing ? "Update your review" : "Write a review"}
      </p>

      <div className="space-y-2">
        <label
          htmlFor="review-rating"
          className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600"
        >
          Rating <span className="text-red-500">*</span>
        </label>
        <div id="review-rating">
          <StarInput value={rating} onChange={setRating} disabled={submitting} />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="review-title"
          className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600"
        >
          Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          placeholder="Summarise your experience"
          className="h-11 w-full border border-gray-200 bg-white px-3 text-sm font-light text-gray-900 transition-colors focus:border-gray-900 focus:outline-none focus:ring-0 disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="review-body"
          className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600"
        >
          Review
        </label>
        <textarea
          id="review-body"
          value={body}
          rows={4}
          maxLength={BODY_MAX}
          onChange={(e) => setBody(e.target.value)}
          disabled={submitting}
          placeholder="Tell us about the craftsmanship, the service, the experience…"
          className="w-full resize-y border border-gray-200 bg-white px-3 py-2.5 text-sm font-light leading-relaxed text-gray-900 transition-colors focus:border-gray-900 focus:outline-none focus:ring-0 disabled:opacity-60"
        />
      </div>

      {error && (
        <p className="text-[12px] font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-[12px] font-medium text-gray-700" role="status">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 bg-black px-10 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
      >
        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
        {submitting
          ? "Submitting…"
          : isEditing
            ? "Update Review"
            : "Submit Review"}
      </button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerReviews({
  productId,
  country,
  initialReviews,
  ratingAverage,
  ratingCount,
}: CustomerReviewsProps) {
  const countryCode = normalizeCountry(country);
  const locale = countryToLocale(countryCode);

  const [reviews, setReviews] = useState<PublicReview[]>(
    () => initialReviews?.items ?? []
  );
  // Aggregate count comes from the server (full total, not just the loaded page).
  const [total, setTotal] = useState(() => initialReviews?.total ?? 0);

  // Server-computed average over ALL approved reviews (C4): prefer the reviews-response aggregate,
  // then the product-level rating passed by the PDP. Falls back to the page-scoped client mean only
  // when no server value exists. Count prefers the server ratingCount, then the total.
  const [serverAverage, setServerAverage] = useState<number | undefined>(
    () => initialReviews?.ratingAverage ?? ratingAverage
  );
  const [serverCount, setServerCount] = useState<number | undefined>(
    () => initialReviews?.ratingCount ?? ratingCount
  );

  // Latest list/total mirrored into refs so the optimistic snapshot is never stale.
  const reviewsRef = useRef(reviews);
  const totalRef = useRef(total);
  reviewsRef.current = reviews;
  totalRef.current = total;

  // Fetch client-side only when the page didn't seed an initial page.
  useEffect(() => {
    if (initialReviews !== undefined) {
      setReviews(initialReviews.items);
      setTotal(initialReviews.total);
      if (initialReviews.ratingAverage !== undefined) setServerAverage(initialReviews.ratingAverage);
      if (initialReviews.ratingCount !== undefined) setServerCount(initialReviews.ratingCount);
      return;
    }
    let cancelled = false;
    getProductReviews(productId, { limit: 10 })
      .then((page) => {
        if (cancelled) return;
        setReviews(page.items);
        setTotal(page.total);
        if (page.ratingAverage !== undefined) setServerAverage(page.ratingAverage);
        if (page.ratingCount !== undefined) setServerCount(page.ratingCount);
      })
      .catch(() => {
        if (!cancelled) {
          setReviews([]);
          setTotal(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId, initialReviews]);

  // Optimistic upsert by id (prepend when new). Captures the exact prior list +
  // total and returns a rollback closure that restores them verbatim on failure.
  const applyOptimistic = useCallback((review: PublicReview): (() => void) => {
    const prevReviews = reviewsRef.current;
    const prevTotal = totalRef.current;
    const isUpdate = prevReviews.some((r) => r.id === review.id);
    const next = isUpdate
      ? prevReviews.map((r) => (r.id === review.id ? review : r))
      : [review, ...prevReviews];
    setReviews(next);
    if (!isUpdate) setTotal(prevTotal + 1);
    return () => {
      setReviews(prevReviews);
      setTotal(prevTotal);
    };
  }, []);

  // Swap the optimistic placeholder for the canonical server review (real id +
  // server-computed verified-purchase flag).
  const reconcile = useCallback(
    (optimisticId: string, canonical: PublicReview) => {
      setReviews((prev) =>
        prev.map((r) => (r.id === optimisticId ? canonical : r))
      );
    },
    []
  );

  // Page-scoped client mean — used ONLY as a last-resort fallback when the server provides no
  // aggregate (C4 prefers the server-computed average over ALL approved reviews).
  const pageAverage = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  // Header average + count: prefer the server aggregate (consistent with the global count),
  // fall back to the page-scoped mean / loaded total only when no server value exists.
  const headerAverage = serverAverage ?? pageAverage;
  const headerCount = serverCount ?? total;

  const hasReviews = reviews.length > 0;

  return (
    <section className="w-full py-12" aria-labelledby="customer-reviews-heading">
      {/* Heading + aggregate */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2
          id="customer-reviews-heading"
          className="text-[28px] font-serif font-normal text-gray-900 tracking-normal"
        >
          Customer Reviews
        </h2>
        {hasReviews && (
          <div className="flex items-center gap-3">
            <Stars count={headerAverage} />
            <span className="text-[13px] tracking-wide text-gray-600 tabular-nums">
              {headerAverage.toFixed(1)} · {headerCount} review{headerCount === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mb-10 h-px w-full bg-gray-300" />

      {/* Reviews grid or honest empty state */}
      {hasReviews ? (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="text-[15px] font-light italic text-gray-500">
          No reviews yet — be the first to share your experience.
        </p>
      )}

      {/* Write / edit form */}
      <div className="mt-14 max-w-2xl border-t border-gray-200 pt-10">
        <WriteReviewForm
          productId={productId}
          countryCode={countryCode}
          applyOptimistic={applyOptimistic}
          reconcile={reconcile}
        />
      </div>
    </section>
  );
}
