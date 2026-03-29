/** Centralized pricing & plan constants for admin dashboard. */

export const PRICING = {
  monthly: 19.90,
  quarterly: 49.90,
  semiannual: 69.90,
  yearly: 99.90, // legacy, no longer offered
} as const;

/** Monthly equivalent for MRR calculation. */
export const MRR_PER_PLAN: Record<string, number> = {
  monthly: PRICING.monthly,
  quarterly: +(PRICING.quarterly / 3).toFixed(2),
  semiannual: +(PRICING.semiannual / 6).toFixed(2),
  yearly: +(PRICING.yearly / 12).toFixed(2),
};

/** Display labels for plans. */
export const PLAN_LABELS: Record<string, string> = {
  monthly: "月付",
  quarterly: "季付",
  semiannual: "半年付",
  yearly: "年付",
  tester: "体验官",
  referral: "推荐奖励",
  recall: "召回",
  reverse_trial: "注册试用",
};

/** Price display strings for plan distribution chart. */
export const PLAN_PRICE_LABELS: Record<string, string> = {
  monthly: `$${PRICING.monthly.toFixed(2)}/月`,
  quarterly: `$${PRICING.quarterly.toFixed(2)}/季`,
  semiannual: `$${PRICING.semiannual.toFixed(2)}/半年`,
  yearly: `$${PRICING.yearly.toFixed(2)}/年`,
};
