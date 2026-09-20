export const PLATFORM_CONFIGS = {
  paytm: {
    name: "Paytm",
    currency: "₹",
    escrowWindowHours: 48,
    merchantPolicyUrl: "...",
    consumerProtectionLaw: "RBI PA/PG Guidelines 2022",
    refundMechanisms: ["UPI_REVERSAL", "WALLET_CREDIT", "BANK_TRANSFER"]
  },
  razorpay: {
    name: "Razorpay",
    currency: "₹",
    escrowWindowHours: 72,
    merchantPolicyUrl: "...",
    consumerProtectionLaw: "RBI PA/PG Guidelines 2022",
    refundMechanisms: ["BANK_TRANSFER", "WALLET_CREDIT"]
  },
  stripe: {
    name: "Stripe",
    currency: "$",
    escrowWindowHours: 120,
    merchantPolicyUrl: "...",
    consumerProtectionLaw: "CFPB Regulation E",
    refundMechanisms: ["CARD_REVERSAL", "BANK_TRANSFER"]
  },
  shopify: {
    name: "Shopify Payments",
    currency: "$",
    escrowWindowHours: 96,
    consumerProtectionLaw: "FTC Consumer Protection",
    refundMechanisms: ["CARD_REVERSAL"]
  }
};
