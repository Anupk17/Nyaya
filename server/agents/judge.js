const Groq = require('groq-sdk');
const { bedrockClient } = require('../lib/aws');
const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { PLATFORM_CONFIGS } = require('../config/platformConfig');

const getSystemPrompt = (config) => `You are the neutral Judge Agent for ${config.name}, an AI dispute resolution system.
You will receive: the evidence summary, the merchant's position, and the customer's position.
Weigh both sides strictly against the evidence — do not simply split the difference.

Identify if the Merchant and Customer agents arrived at conflicting conclusions. If they disagree significantly, provide a brief 'conflict_summary' explaining the core disagreement. If they agree, set it to null.

Output a verdict, a confidence score from 0-100 reflecting how clearly the evidence supports your decision (not how confident you sound), and 2-4 reasoning bullets that each cite a specific piece of evidence.
If the evidence is genuinely ambiguous or contradictory, your confidence score MUST be low — do not inflate confidence to appear decisive.

For the amount field: if verdict is "FULL_REFUND", set recommended_amount to the full transaction amount. If "PARTIAL_REFUND", set a proportional amount. If "DENY" or "ESCALATE", set recommended_amount to 0.

Set fraud_flag to true ONLY if there are clear indicators of fraudulent behavior.

REFUND MECHANISM RULES:
You must determine which refund path applies
based on when the dispute was filed:

PATH A — ESCROW REFUND (dispute filed within ${config.escrowWindowHours}hrs):
  Money is still with ${config.name}. ${config.name} can withhold
  merchant payout and refund customer directly.
  Use this when: dispute filed within ${config.escrowWindowHours} hours.
  Action label: "Escrow Withhold & Customer Refund"

PATH B — MERCHANT CHARGEBACK (dispute after ${config.escrowWindowHours}hrs):
  Money already paid to merchant. ${config.name} cannot
  debit merchant directly. ${config.name} must:
  1. Request voluntary refund from merchant
  2. If refused, suspend merchant payouts
  3. Raise formal chargeback through payment network
  Action label: "Merchant Chargeback Request"

PATH C — GOODWILL REFUND (${config.name} absorbs cost):
  Used only when merchant is unresponsive AND
  customer has very strong evidence AND
  amount is small (under ${config.currency}500).
  ${config.name} pays from its own dispute resolution fund.
  Action label: "${config.name} Goodwill Credit"

Return ONLY valid JSON with no preamble or explanation:
{
  "verdict": "FULL_REFUND" | "DENY" | "PARTIAL_REFUND" | "ESCALATE",
  "recommended_amount": number,
  "confidence": number,
  "reasoning": ["string — each citing specific evidence"],
  "conflict_summary": "string | null",
  "fraud_flag": boolean,
  "refund_path": "ESCROW" | "CHARGEBACK" | "GOODWILL" | "UNKNOWN",
  "settlement_assumption": "PRE_SETTLEMENT" | "POST_SETTLEMENT",
  "merchant_action_required": boolean,
  "action_description": "string — plain english what actually happens"
}`;



async function run(evidenceSummary, merchantPosition, customerPosition, transactionAmount, disputeId, options = {}) {
  const platform = options.platform || 'paytm';
  const config = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.paytm;
  const SYSTEM_PROMPT = getSystemPrompt(config);

  const userMessage = `EVIDENCE SUMMARY:\n${JSON.stringify(evidenceSummary, null, 2)}\n\nMERCHANT'S POSITION:\n${JSON.stringify(merchantPosition, null, 2)}\n\nCUSTOMER'S POSITION:\n${JSON.stringify(customerPosition, null, 2)}\n\nDeliver your verdict.`;

  if (options.useBedrock) {
    try {
      console.log('Judge Agent: Using AWS Bedrock (Claude 3 Sonnet)');
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }]
        })
      });
      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const content = responseBody.content[0].text;
      return JSON.parse(content);
    } catch (e) {
      console.warn('Judge Agent: Bedrock API unavailable or errored, using fallback:', e.message);
    }
  } else {
    const apiKey = process.env.GROQ_API_KEY_JUDGE || process.env.GROQ_API_KEY;
    const localUrl = process.env.LOCAL_LLM_URL;
    if (localUrl || (apiKey && apiKey !== 'gsk_your_groq_api_key_here')) {
      try {
        const groq = new Groq({ 
          apiKey: localUrl ? 'lm-studio' : apiKey,
          baseURL: localUrl || undefined
        });
        const userMessage = `EVIDENCE SUMMARY:\n${JSON.stringify(evidenceSummary, null, 2)}\n\nMERCHANT'S POSITION:\n${JSON.stringify(merchantPosition, null, 2)}\n\nCUSTOMER'S POSITION:\n${JSON.stringify(customerPosition, null, 2)}\n\nTRANSACTION AMOUNT: ${config.currency}${transactionAmount}\n\nDeliver your verdict.`;

        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          model: 'qwen/qwen3.8-27b',
          temperature: 0.1,
          max_tokens: 512,
          response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content;
        return JSON.parse(content);
      } catch (e) {
        throw new Error('Groq API unavailable or errored: ' + e.message);
      }
    } else {
      throw new Error('No Groq API key found.');
    }
  }

}

module.exports = { run };


