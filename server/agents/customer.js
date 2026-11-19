const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are the Cardholder & Issuer Advocate for Nyaya, examining Cashfree merchant chargebacks.
Your role: Make the strongest honest case for the cardholder / customer and their issuing bank under RBI consumer protection regulations and card network operating rules (Visa/Mastercard/RuPay Chargeback Guidelines).
Examine the dispute reason, customer claim, lack of evidence, delays, or service shortcomings.
Do not invent facts; point out what the merchant has failed to substantiate.
State clearly that this analysis is an AI recommendation for review.

Return ONLY valid JSON with no preamble or explanation:
{
  "position": "REFUND" | "ACCEPT" | "CONTEST",
  "cardholder_arguments": ["string - specific points supporting the buyer/issuer claim"],
  "issuer_vulnerabilities": ["string - weaknesses in the cardholder case, if any"],
  "consumer_rights_cited": "string - relevant consumer protection or chargeback clause"
}`;

async function run(evidenceSummary, dispute, options = {}) {
  const apiKey = process.env.GROQ_API_KEY_CUSTOMER || process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('your_groq_api_key')) {
    const isWeakProof = evidenceSummary.evidence_strength < 65;
    return {
      position: isWeakProof ? "REFUND" : "ACCEPT",
      cardholder_arguments: [
        dispute.customer_details?.customer_claim || dispute.reason_description,
        isWeakProof ? "Merchant has not produced indisputable delivery proof." : "Cardholder filed timely claim."
      ],
      issuer_vulnerabilities: isWeakProof ? [] : ["Order was OTP authenticated at delivery"],
      consumer_rights_cited: "RBI Consumer Protection Guidelines on electronic payment transactions"
    };
  }

  const groq = new Groq({ apiKey, maxRetries: 1, timeout: 8000 });
  const userMessage = `EVIDENCE SUMMARY:
${JSON.stringify(evidenceSummary, null, 2)}

CARDHOLDER CLAIM & DISPUTE DETAILS:
${JSON.stringify({
  dispute_id: dispute.dispute_id,
  reason_code: dispute.reason_code,
  reason_description: dispute.reason_description,
  customer_details: dispute.customer_details,
  amount: dispute.dispute_amount
}, null, 2)}

Formulate the cardholder and issuing bank case.`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ],
    model: 'qwen/qwen3.8-27b',
    temperature: 0.1,
    max_tokens: 350,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content;
  return JSON.parse(content);
}

module.exports = { run };
