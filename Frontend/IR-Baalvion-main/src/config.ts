import { LEGAL_ENTITY_NAME } from "@baalvion/company";

export const AppConfig = {
    appName: 'Investor Relation',
    // The registered name, not a local spelling of it. This app previously carried a third
    // variant here while its own footer carried a US corporate suffix.
    companyName: LEGAL_ENTITY_NAME,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://ir.baalvion.com',
};
