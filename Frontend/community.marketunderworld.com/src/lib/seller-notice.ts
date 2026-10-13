// A seller notice is an ordinary announcement whose headline starts with this tag. The public banner
// skips tagged ones; the seller pages show only tagged ones. Nothing else in the announcement
// system needs to know about it.
export const SELLER_TAG = "[sellers] "

export const isSellerNotice = (title: string) => title.toLowerCase().startsWith(SELLER_TAG)
export const withSellerTag = (title: string) => (isSellerNotice(title) ? title : `${SELLER_TAG}${title}`)
export const stripSellerTag = (title: string) => (isSellerNotice(title) ? title.slice(SELLER_TAG.length) : title)
