/**
 * Cache tags shared by the data layer and the /api/revalidate webhook.
 *
 * Kept in its own module (rather than exported from cms-public.ts) so a loader
 * that only needs the tag string doesn't pull cms-public's whole graph —
 * article types, @baalvion/illustrations, the editorial guides — into its own
 * module init. That cost is paid on every serverless cold start.
 */

/**
 * Every cached read of admin/CMS-authored content carries this tag, so one
 * revalidateTag() in the publish webhook invalidates all of them at once —
 * including pages the webhook's caller has no way to enumerate (category hubs
 * whose feed now includes the new article, every article sidebar's trending
 * rail, /_not-found's trending list).
 *
 * This — not the fetch-level revalidate window — is what makes an edit appear
 * on the site. The windows are the safety net for when the webhook never fires.
 */
export const CMS_CACHE_TAG = 'cms-content';
