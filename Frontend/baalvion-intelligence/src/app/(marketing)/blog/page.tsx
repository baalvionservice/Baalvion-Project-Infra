import type { Metadata } from "next";

import { BlogList } from "./blog-list";

export const metadata: Metadata = {
  title: "The Blog Where We Show Our Work (and Our Mistakes)",
  description:
    "Engineering deep-dives, product updates, and the real story behind building a real-time news intelligence engine — no fluff.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="section-container section-y">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <span className="eyebrow mx-auto w-fit justify-center">Blog</span>
        <h1>News intelligence, built in public</h1>
      </div>
      <BlogList />
    </div>
  );
}
