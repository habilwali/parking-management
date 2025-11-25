export type PlanType = "monthly" | "weekly" | "bi-weekly";

export function calculateExpiryDate(
  startDate: Date,
  planType: PlanType,
): Date {
  const expiry = new Date(startDate);
  switch (planType) {
    case "weekly":
      expiry.setDate(expiry.getDate() + 7);
      break;
    case "bi-weekly":
      expiry.setDate(expiry.getDate() + 14);
      break;
    case "monthly":
    default:
      expiry.setMonth(expiry.getMonth() + 1);
      break;
  }
  return expiry;
}

