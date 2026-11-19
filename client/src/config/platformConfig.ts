export const PLATFORM_CONFIGS = {
  cashfree: {
    name: "Cashfree",
    currency: "₹",
    escrowWindowHours: 72,
    merchantPolicyUrl: "https://docs.cashfree.com/docs/disputes",
    consumerProtectionLaw: "RBI Payment Aggregator Guidelines & NPCI Chargeback Framework",
    refundMechanisms: ["CASHFREE_INSTANT_REFUND", "STANDARD_REFUND", "ORIGINAL_PAYMENT_MODE"]
  }
};
