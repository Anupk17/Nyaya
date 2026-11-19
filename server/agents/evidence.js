const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are the neutral Evidence Agent for Nyaya, an AI chargeback-defense teammate for Cashfree merchants.
Analyze the Cashfree dispute record, order details, preferred evidence types required by card networks, and evidence documents submitted so far.
1. Objectively compare uploaded evidence against preferred_evidence.
2. Mark what is covered and what is missing. Never invent facts; mark missing items as UNKNOWN or MISSING.
3. Check for any fraud flags (e.g., mismatched addresses, suspicious claims, OTP missing vs present).
4. Note that all outputs are recommendations for human review.

Return ONLY valid JSON with no preamble or explanation:
{
  "evidence_strength": 0,
  "covered": ["string - specific evidence items available"],
  "missing": ["string - required evidence items missing"],
  "fraud_flags": ["string - any fraud risk indicators"],
  "summary": "string - objective factual overview"
}`;

async function run(dispute, options = {}) {
  const apiKey = process.env.GROQ_API_KEY_EVIDENCE || process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('your_groq_api_key')) {
    // Fallback if no Groq key provided
    const hasEvidence = dispute.dispute_evidence && dispute.dispute_evidence.length > 0;
    const hasOtp = dispute.order_details?.delivery_details?.otp_verified;
    return {
      evidence_strength: hasOtp ? 85 : (hasEvidence ? 60 : 30),
      covered: (dispute.dispute_evidence || []).map(e => e.doc_type || e.file_name),
      missing: (dispute.preferred_evidence || []).filter(p => !(dispute.dispute_evidence || []).some(e => p.toLowerCase().includes((e.doc_type || '').toLowerCase()))),
      fraud_flags: dispute.reason_code === '10.4' ? ['Cardholder denies transaction authorization'] : [],
      summary: `Dispute ${dispute.dispute_id} filed for ${dispute.reason_description}. Delivery OTP: ${hasOtp ? 'VERIFIED' : 'NOT VERIFIED'}.`
    };
  }

  const groq = new Groq({ apiKey });
  const userMessage = `CASHFREE DISPUTE DOSSIER:
${JSON.stringify({
  dispute_id: dispute.dispute_id,
  stage: dispute.dispute_type || dispute.stage,
  reason_code: dispute.reason_code,
  reason_description: dispute.reason_description,
  dispute_amount: dispute.dispute_amount,
  respond_by: dispute.respond_by,
  preferred_evidence: dispute.preferred_evidence || [],
  dispute_evidence: dispute.dispute_evidence || [],
  order_details: dispute.order_details,
  customer_details: dispute.customer_details
}, null, 2)}

Compare available evidence against required evidence and output your neutral assessment.`;

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
