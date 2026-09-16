/**
 * Cache tags shared by the data layer and the /api/revalidate webhook.
 *
 * Kept in its own module so a loader that only needs the tag string doesn't
 * pull the whole CMS client's graph into its module init — a cost paid on
 * every serverless cold start.
 */

/**
 * Every cached read of CMS-authored editorial content carries this tag, so one
 * revalidateTag() in the publish webhook drops all of them at once — including
 * pages the webhook's caller has no way to name.
 *
 * This — not the fetch-level revalidate window — is what makes an edit appear
 * on the site. The window is the safety net for when the webhook never fires.
 */
export const CMS_CACHE_TAG = 'cms-content';
