/**
 * How many roles a public listing page shows.
 *
 * Kept in one place because the server prerender and the client's SWR key have to agree
 * exactly — if they diverge, the first paint is replaced by a refetch and the visitor
 * sees the list flicker.
 */
export const PUBLIC_PAGE_SIZE = 12;
