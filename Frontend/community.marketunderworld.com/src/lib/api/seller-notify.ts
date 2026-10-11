// Tells a seller what an admin decided. These run AFTER the commerce action succeeded and never
// fail it: if the notification can't be sent, the decision still stands (the seller can still
// see the outcome on their dashboard). The notification endpoint only accepts on-site links.

import { listSellerApplications, type AdminProductQueueItem, type SellerApplication } from "./commerce-admin";
import { notifyUser } from "./staff";

// Platform user ids are whatever the auth service issues (numeric today), not UUIDs.
const UUID = /^[A-Za-z0-9_-]{1,64}$/;
let storeOwners: Map<string, string> | null = null;

async function ownerOfStore(storeId: string): Promise<string | null> {
  if (!storeOwners) {
    const map = new Map<string, string>();
    for (let page = 1; page <= 20; page += 1) {
      const res = await listSellerApplications({ status: "approved", page, limit: 100 });
      for (const a of res.items) if (a.createdStoreId) map.set(a.createdStoreId, a.applicantUserId);
      if (res.items.length < 100) break;
    }
    storeOwners = map;
  }
  return storeOwners.get(storeId) ?? null;
}

const safely = async (send: () => Promise<unknown>) => {
  try { await send(); } catch { /* the decision already went through */ }
};

export function notifySellerApplication(app: SellerApplication, outcome: "approved" | "rejected", reason?: string) {
  if (!UUID.test(app.applicantUserId)) return Promise.resolve();
  if (outcome === "approved") storeOwners = null; // a new store now exists; refresh the lookup next time
  return safely(() => notifyUser({
    userId: app.applicantUserId,
    type: "seller",
    title: outcome === "approved" ? `Your seller application was approved: ${app.storeName}` : `Your seller application was not approved: ${app.storeName}`,
    body: outcome === "approved" ? "Your store is set up. Add your first listing; each one is reviewed before it goes live." : (reason || "No reason was given.").slice(0, 400),
    url: outcome === "approved" ? "/seller/listings" : "/seller/onboarding",
  }));
}

export function notifyListing(item: AdminProductQueueItem, outcome: "approved" | "rejected", reason?: string) {
  return safely(async () => {
    const userId = await ownerOfStore(item.storeId);
    if (!userId || !UUID.test(userId)) return;
    await notifyUser({
      userId,
      type: "listing",
      title: outcome === "approved" ? `Your listing is live: ${item.name}` : `Your listing needs changes: ${item.name}`,
      body: outcome === "approved" ? "It now appears in the shop." : (reason || "No reason was given.").slice(0, 400),
      url: `/seller/listings/${item.id}/edit`,
    });
  });
}
