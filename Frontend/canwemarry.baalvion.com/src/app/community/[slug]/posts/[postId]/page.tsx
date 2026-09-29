
import { notFoundIfMissing } from '@/lib/api/not-found';
import type { ApiError } from '@/lib/api/client';
import {
  Breadcrumbs, Container, ErrorState, RelativeTime, Section,
} from '@/components/ui';
import { CommentThread } from '@/components/comments/comment-thread';
import { Reactions } from '@/components/cases/reactions';
import { PostActions } from '@/components/community/post-actions';
import { communities, posts as postsApi, identity as identityApi } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { Post } from '@/lib/api/types';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Discussion');
export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: Promise<{ slug: string; postId: string }> }) {
  const { slug, postId } = await params;
  const options = await serverOptions();

  const [postResult, communityResult, meResult] = await Promise.all([
    postsApi.get(postId, options),
    communities.getBySlug(slug, options),
    identityApi.me(options),
  ]);

  if (!postResult.ok || !communityResult.ok) {
    // Whichever failed decides: a genuine 404 means the post or the community is not there
    // (or not this reader's to see); anything else is a failure to reach the service.
    const failure = notFoundIfMissing(postResult.ok === false ? postResult.error : (communityResult as { ok: false; error: ApiError }).error);
    return (
      <Container className="py-16">
        <ErrorState as="h1" message={failure.message} />
      </Container>
    );
  }

  const post = postResult.data as Post;
  const community = communityResult.data;
  // Posting a comment needs membership; the server checks it, this only picks the wording.
  const canComment = Boolean(meResult.ok) && community.isMember && !post.isLocked;

  return (
    <Container width="prose" className="py-10">
      <Breadcrumbs items={[
        { href: '/', label: 'Home' },
        { href: '/community', label: 'Community' },
        { href: `/community/${slug}`, label: community.name },
        { label: post.title },
      ]} />

      <article>
        <h1 className="heading text-3xl">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-2">
          Posted <RelativeTime value={post.createdAt} /> · {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}
        </p>
        <div className="mt-6 whitespace-pre-line text-body leading-relaxed">{post.body}</div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Reactions targetType="POST" targetId={post.id} />
          <PostActions post={post} communitySlug={slug} />
        </div>
      </article>

      <div className="mt-12">
        <Section title="Replies" as="h2">
          <CommentThread
            targetType="POST"
            targetId={post.id}
            canComment={canComment}
            cannotCommentReason={
              post.isLocked
                ? 'This discussion has been locked by a moderator.'
                : community.isMember
                  ? 'Sign in to reply.'
                  : 'Join this community to take part in its discussions.'
            }
          />
        </Section>
      </div>
    </Container>
  );
}