"use client"

import { useEffect, useState } from "react"
import { Star, Loader2, ShieldCheck } from "lucide-react"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { getProductReviews, MARKET_UNDERWORLD_STORE_ID, type ProductReview } from "@/lib/api/commerce"
import { submitReview, getMyReview, type MyReview } from "@/lib/api/commerce-admin"

export function ProductReviews({ productId }: { productId: string }) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProductReviews(productId).then((res) => setReviews(res.items)).finally(() => setLoading(false));
    if (isAuthenticated) {
      getMyReview(MARKET_UNDERWORLD_STORE_ID, productId).then((r) => {
        if (r) { setMyReview(r); setRating(r.rating); setTitle(r.title || ""); setBody(r.body || ""); }
      }).catch(() => {});
    }
  }, [productId, isAuthenticated]);

  const handleSubmit = async () => {
    if (rating < 1) {
      toast({ variant: "destructive", title: "Choose a star rating" });
      return;
    }
    setSubmitting(true);
    try {
      const review = await submitReview(MARKET_UNDERWORLD_STORE_ID, productId, { rating, title: title || undefined, body: body || undefined });
      setMyReview(review);
      toast({
        title: review.status === "approved" ? "Review published" : "Review submitted",
        description: review.status === "approved" ? "Thanks for your feedback!" : "It'll appear once a moderator reviews it.",
      });
      if (review.status === "approved") {
        const res = await getProductReviews(productId);
        setReviews(res.items);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't submit review", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-8">
      <h2 className="text-lg font-bold text-white">Reviews</h2>

      {isAuthenticated && (
        <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-4">
          <p className="text-sm font-bold text-white">{myReview ? "Update your review" : "Write a review"}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} type="button">
                <Star className={`w-6 h-6 ${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-700"}`} />
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 h-10 text-sm text-white outline-none focus:border-cyan-500/50"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience (optional)"
            className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white outline-none focus:border-cyan-500/50 resize-none"
          />
          <NexusButton onClick={handleSubmit} isLoading={submitting} className="h-10 px-6 text-sm">
            {myReview ? "Update Review" : "Submit Review"}
          </NexusButton>
          {myReview && myReview.status === "pending" && (
            <p className="text-xs text-amber-400">Your review is pending moderation.</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center text-gray-600 py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-white/5 pb-6 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-700"}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-white">{r.author}</span>
                {r.isVerifiedPurchase && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase">
                    <ShieldCheck className="w-3 h-3" /> Verified Purchase
                  </span>
                )}
                <span className="text-[10px] text-gray-600 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.title && <p className="text-sm font-bold text-white">{r.title}</p>}
              {r.body && <p className="text-sm text-gray-400">{r.body}</p>}
              {r.reply && (
                <div className="ml-4 mt-2 p-3 rounded-lg bg-white/[0.02] border-l-2 border-cyan-500/30">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase mb-1">Seller Reply</p>
                  <p className="text-xs text-gray-400">{r.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
