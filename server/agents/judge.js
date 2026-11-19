const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are the neutral Judge Agent for Nyaya, an AI chargeback-defense teammate for Cashfree merchants.
You receive:
1. The Cashfree dispute dossier
2. The Evidence Agent assessment
3. The Merchant Advocate defense
4. The Cardholder & Issuer Advocate position
5. Any Cognee memory precedents (e.g., repeat customer history)

Your mission:
Weigh all sides strictly against card network operating rules and evidence facts. Outputs are recommendations only; final actions must be approved by a human merchant ops reviewer.

Decision Rules:
1. recommendation options: MUST be one of "CONTEST", "ACCEPT", "REFUND", "ESCALATE".
2. If confidence < 65 => recommendation MUST be "ESCALATE".
3. If any fraud flags are present (e.g., identity theft, stolen card) => recommendation MUST be "ESCALATE".
4. If win_likelihood is low (< 45%) and issuing a refund is cheaper than losing the dispute plus incurring chargeback penalty fees => recommend "REFUND" early.
5. If merchant has solid proof (e.g., verified OTP delivery, matching geo-coordinates, valid invoice) => recommend "CONTEST".
6. If goods are damaged or service incomplete and merchant has no counter-evidence => recommend "ACCEPT" or "REFUND".
7. Compare Merchant and Cardholder positions. If they conflict significantly, set conflict_detected = true and provide conflict_summary; otherwise false and null.
8. Build evidence_checklist mapping every preferred_evidence item to HAVE or MISSING.
9. amount_at_risk is the full dispute amount. expected_recovery = (win_likelihood / 100) * dispute_amount (if CONTEST), or 0 if ACCEPT/REFUND.

Return ONLY valid JSON with no preamble:
{
  "recommendation": "CONTEST" | "ACCEPT" | "REFUND" | "ESCALATE",
  "win_likelihood": 0,
  "confidence": 0,
  "amount_at_risk": 0,
  "expected_recovery": 0,
  "deadline_note": "string - urgency and remaining time evaluation",
  "reasoning": [
    "string - citing specific evidence fact 1",
    "string - citing specific evidence fact 2",
    "string - citing specific evidence fact 3"
  ],
  "evidence_checklist": [
    { "item": "string", "status": "HAVE" | "MISSING" }
  ],
  "conflict_detected": false,
  "conflict_summary": "string or null"
}`;

async function run(evidenceSummary, merchantPos, cardholderPos, dispute, memoryPrecedents = null, options = {}) {
  const apiKey = process.env.GROQ_API_KEY_JUDGE || process.env.GROQ_API_KEY;
  const localUrl = (process.env.LOCAL_LLM_URL && process.env.LOCAL_LLM_URL.trim()) ? process.env.LOCAL_LLM_URL.trim() : null;
  const disputeAmount = parseFloat(dispute.dispute_amount || 0);

  // Fallback calculation helper if AI is unavailable or rate-limited
  const buildFallback = () => {
    const hasFlags = (evidenceSummary.fraud_flags && evidenceSummary.fraud_flags.length > 0) || dispute.reason_code === '10.4';
    const strength = evidenceSummary.evidence_strength || 50;
    let rec = 'CONTEST';
    let win = 75;
    let conf = 80;

    if (hasFlags && strength < 70) {
      rec = 'ESCALATE';
      win = 40;
      conf = 60;
    } else if (strength < 45) {
      rec = 'REFUND';
      win = 25;
      conf = 78;
    } else if (strength >= 75) {
      rec = 'CONTEST';
      win = 82;
      conf = 88;
    }

    const checklist = (dispute.preferred_evidence || []).map(item => ({
      item,
      status: (evidenceSummary.covered || []).some(c => item.toLowerCase().includes(c.toLowerCase())) ? 'HAVE' : 'MISSING'
    }));

    return {
      recommendation: rec,
      win_likelihood: win,
      confidence: conf,
      amount_at_risk: disputeAmount,
      expected_recovery: rec === 'CONTEST' ? Math.round((win / 100) * disputeAmount) : 0,
      deadline_note: `Dispute respond_by deadline is ${dispute.respond_by}. Action required.`,
      reasoning: [
        `Evidence strength evaluated at ${strength}%.`,
        merchantPos.argument_summary || "Merchant claim analyzed.",
        cardholderPos.cardholder_arguments?.[0] || "Cardholder position evaluated."
      ],
      evidence_checklist: checklist,
      conflict_detected: merchantPos.position !== cardholderPos.position,
      conflict_summary: merchantPos.position !== cardholderPos.position ? "Merchant requests contesting while cardholder demands full reversal." : null
    };
  };

  try {
    const client = new Groq({
      apiKey: (localUrl && !apiKey) ? 'lm-studio' : (apiKey || 'dummy'),
      baseURL: localUrl || undefined,
      maxRetries: 1,
      timeout: 8000
    });

    const userMessage = `DISPUTE CASE DOSSIER:
- Dispute ID: ${dispute.dispute_id}
- Stage: ${dispute.dispute_type || dispute.stage}
- Reason: ${dispute.reason_code} - ${dispute.reason_description}
- Amount: Rs ${disputeAmount}
- Deadline: ${dispute.respond_by}
- Preferred Evidence: ${JSON.stringify(dispute.preferred_evidence || [])}

EVIDENCE AGENT ANALYSIS:
${JSON.stringify(evidenceSummary, null, 2)}

MERCHANT ADVOCATE CASE:
${JSON.stringify(merchantPos, null, 2)}

CARDHOLDER & ISSUER CASE:
${JSON.stringify(cardholderPos, null, 2)}

COGNEE MEMORY PRECEDENTS:
${JSON.stringify(memoryPrecedents || "No previous disputes for this buyer.", null, 2)}

Deliver your binding AI recommendation and checklist.`;

    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      model: 'qwen/qwen3.8-27b',
      temperature: 0.1,
      max_tokens: 450,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Post-processing rules enforcement
    if (parsed.confidence < 65 || (evidenceSummary.fraud_flags && evidenceSummary.fraud_flags.length > 0)) {
      parsed.recommendation = 'ESCALATE';
    }
    if (!parsed.amount_at_risk) parsed.amount_at_risk = disputeAmount;
    if (parsed.recommendation === 'CONTEST' && !parsed.expected_recovery) {
      parsed.expected_recovery = Math.round(((parsed.win_likelihood || 70) / 100) * disputeAmount);
    }
    if (parsed.recommendation !== 'CONTEST') {
      parsed.expected_recovery = 0;
    }

    return parsed;
  } catch (err) {
    console.warn('Judge Agent: Falling back to rule-based evaluation:', err.message);
    return buildFallback();
  }
}

module.exports = { run };
