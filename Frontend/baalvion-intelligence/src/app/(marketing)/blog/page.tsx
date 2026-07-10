import type { Metadata } from "next";

import { BlogList } from "./blog-list";

export const metadata: Metadata = {
  title: "Blog",
  description: "Engineering deep-dives and product updates from the Baalvion Intelligence team.",
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
