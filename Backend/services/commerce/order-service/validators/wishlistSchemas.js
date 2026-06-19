'use strict';
const { z } = require('zod');

// Add a product (optionally a specific variant) to the authenticated shopper's wishlist. The
// wishlist owner is resolved SERVER-SIDE from req.auth.userId — never a client-supplied id.
exports.addWishlistItemSchema = z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional().nullable(),
});
