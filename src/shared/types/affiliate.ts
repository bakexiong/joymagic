export const AFFILIATE_COOKIE_NAME = "za_affiliate_attribution";

export const AFFILIATE_QUERY_KEYS = ["rk"] as const;

export interface AffiliateAttributionCookie {
  affiliateCode: string;
  affiliateProfileId?: string | null;
  visitId?: string | null;
  firstVisitId?: string | null;
  sessionId?: string | null;
  expiresAt: string;
}
