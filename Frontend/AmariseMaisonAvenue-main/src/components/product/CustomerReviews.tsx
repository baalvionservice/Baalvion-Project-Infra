"use client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Review {
  id: number;
  rating: number;
  title: string;
  body: string;
  author: string;
}

// ─── Data — exact copy from MAC site ─────────────────────────────────────────
const REVIEWS: Review[] = [
  {
    id: 1,
    rating: 5,
    title: "I AM SO VERY PLEASED WITH MY PURCHASE!",
    body: "I had not purchased from Madison Avenue Couture previously. I was looking for a particular bag and called. A very kind and helpful gentleman named Marc was happy to assist me. Marc sent me additional pictures and answered my questions. The beautiful bag arrived today and it is absolutely stunning. Marc's follow up was wonderful and I am so very pleased with my purchase! Thank you!",
    author: "THERESA",
  },
  {
    id: 2,
    rating: 5,
    title: "AMAZING CUSTOMER SERVICE!",
    body: "Amazing customer service! From the beginning to when I received my gorgeous Bag, Maison Avenue Couture has been very responsive. My bag is exactly as it was described! In perfect condition. I highly recommend them to anyone! Thank you!",
    author: "VIRGINIE",
  },
  {
    id: 3,
    rating: 5,
    title: "I'LL BE BACK FOR MORE PURCHASES!",
    body: "Extremely pleasant and professional experience! They were prompt in answering my numerous questions and delivered 100% as promised! The custom Kelly 25 that I got is a show-stopper, and it came brand new with everything included! I'd recommend this business to anyone looking for a one-of-a-kind handbag that will elevate your outfit to a whole other level! Very happy customer - I'll be back for more purchases!",
    author: "VIKTORIYA",
  },
];

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4 text-gray-900"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.95 2.678c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Single Review Card ───────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex flex-col gap-4">
      <Stars count={review.rating} />
      <h3 className="text-[13px] font-bold tracking-wide text-gray-900 leading-snug uppercase">
        {review.title}
      </h3>
      <p className="text-[14px] text-gray-700 leading-relaxed font-normal">
        {review.body}
      </p>
      <p className="text-[12px] font-bold tracking-[0.2em] text-gray-900 mt-auto">
        - {review.author}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerReviews() {
  return (
    <section className="w-full py-12">
      {/* Heading */}
      <h2 className="text-[28px] font-serif font-normal text-gray-900 mb-5 tracking-normal">
        Customer Reviews
      </h2>

      {/* Divider */}
      <div className="w-full h-px bg-gray-300 mb-10" />

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
        {REVIEWS.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}