// The directory is discovery; the deal itself happens on the IR platform.
//
// ir.baalvion.com/onboarding/business is a public, unauthenticated KYC intake that writes to
// ir_business_applications, where the IR review queue picks it up and the commitment, capital
// call and shareholder machinery takes over. Pointing founders at the directory's own
// /deals/new instead sent them into a paid membership gate — a wall in front of the one thing
// we want them to do.
const IR_BASE = (import.meta as any).env?.VITE_IR_URL || "https://ir.baalvion.com";

/**
 * @param source where the founder clicked from, so IR can see which surfaces actually convert
 */
export const irBusinessOnboardingUrl = (source: string) => {
  const u = new URL("/onboarding/business", IR_BASE);
  u.searchParams.set("utm_source", "insiders-directory");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_content", source);
  return u.toString();
};

export const IR_HOME = IR_BASE;
