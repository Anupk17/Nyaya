const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are the Merchant Advocate for Nyaya, an AI chargeback-defense teammate for Cashfree merchants.
Your role: Make the strongest, most compelling, and completely honest case for CONTESTING this dispute on behalf of the merchant.
Use ONLY supplied facts from the Cashfree dispute, order records, delivery/OTP logs, and evidence summary.
Do not fabricate evidence. Never invent tracking numbers or OTP confirmations if they do not exist.
Acknowledge clear gaps honestly so the Judge Agent knows exact exposure.
State that this analysis is an AI recommendation for merchant ops review.

Return ONLY valid JSON with no preamble or explanation:
{
  "position": "CONTEST" | "REFUND" | "ACCEPT",
  "argument_summary": "string - core argument for defending or settling",
  "key_defenses": ["string - specific points supporting the merchant"],
  "merchant_exposure": "string - realistic liability if lost"
}`;

async function run(evidenceSummary, dispute, options = {}) {
  const apiKey = process.env.GROQ_API_KEY_MERCHANT || process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('your_groq_api_key')) {
    const isStrong = evidenceSummary.evidence_strength >= 70;
    return {
      position: isStrong ? "CONTEST" : "REFUND",
      argument_summary: isStrong ? "Valid fulfillment verified with tracking logs." : "Proof is insufficient; early settlement recommended.",
      key_defenses: isStrong ? ["Order dispatched to verified customer address", "Valid invoice on record"] : ["Limited documentation available"],
      merchant_exposure: `Rs ${dispute.dispute_amount} plus potential gateway chargeback fee.`
    };
  }

  const groq = new Groq({ apiKey });
  const userMessage = `EVIDENCE SUMMARY:
${JSON.stringify(evidenceSummary, null, 2)}

DISPUTE & ORDER CONTEXT:
${JSON.stringify({
  dispute_id: dispute.dispute_id,
  amount: dispute.dispute_amount,
  stage: dispute.dispute_type || dispute.stage,
  order_details: dispute.order_details,
  dispute_evidence: dispute.dispute_evidence
}, null, 2)}

Formulate the strongest honest defense for the merchant.`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ],
    model: 'qwen/qwen3.8-27b',
    temperature: 0.1,
    max_tokens: 1024,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content;
  return JSON.parse(content);
}

module.exports = { run };
