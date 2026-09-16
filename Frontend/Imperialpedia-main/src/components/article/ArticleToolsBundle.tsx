// Splitting ArticleQuiz and ArticlePoll into two separate next/dynamic chunks
// (as they were before) meant two separate fetch+parse+execute bursts for two
// components under 100 lines each — that's mostly per-chunk overhead, not
// payload savings. They render right next to each other in the "TOOLS &
// QUIZZES" block, so one chunk for both means one hydration burst instead of two.
"use client";
export { ArticleQuiz } from "./ArticleQuiz";
export { ArticlePoll } from "./ArticlePoll";
