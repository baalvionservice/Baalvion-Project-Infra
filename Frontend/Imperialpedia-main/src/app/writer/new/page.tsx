"use client";

import React, { Suspense } from "react";
import { ArticleEditor } from "@/modules/content-engine/components/ArticleEditor";

// Prevent prerendering for this page since it uses client-side form hooks
export const dynamic = "force-dynamic";

/**
 * Page for creating a new financial intelligence article.
 */
export default function NewArticlePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArticleEditor />
    </Suspense>
  );
}
