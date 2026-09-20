const Groq = require('groq-sdk');
const { bedrockClient } = require('../lib/aws');
const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { PLATFORM_CONFIGS } = require('../config/platformConfig');

const getSystemPrompt = (config) => `You represent the MERCHANT in this dispute for ${config.name}.
Apply the ${config.name} Standard Merchant Service Level Agreements and policies.
Given the evidence summary and the merchant's original claim, make the strongest honest case for the merchant's position.
Do not fabricate evidence that wasn't provided.
Acknowledge weaknesses in the merchant's position if the evidence clearly contradicts them — your credibility with the Judge Agent depends on not overreaching.

Return ONLY valid JSON with no preamble or explanation:
{
  "position": "string — the merchant's overall argument",
  "supporting_points": ["string — each a specific point supporting the merchant's case"]
}`;



async function run(evidenceSummary, merchantClaim, disputeId, options = {}) {
  const platform = options.platform || 'paytm';
  const config = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.paytm;
  const SYSTEM_PROMPT = getSystemPrompt(config);

  const userMessage = `EVIDENCE SUMMARY:\n${JSON.stringify(evidenceSummary, null, 2)}\n\nMERCHANT'S ORIGINAL CLAIM:\n${merchantClaim}\n\nPresent the strongest honest case for the merchant.`;

  if (options.useBedrock) {
    try {
      console.log('Merchant Agent: Using AWS Bedrock (Claude 3 Haiku)');
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-haiku-4-5-20251001-v1:0',
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
      console.warn('Merchant Agent: Bedrock API unavailable or errored, using fallback:', e.message);
    }
  } else {
    const apiKey = process.env.GROQ_API_KEY_MERCHANT || process.env.GROQ_API_KEY;
    if (apiKey && apiKey !== 'gsk_your_groq_api_key_here') {
      try {
        const groq = new Groq({ apiKey });
      const userMessage = `EVIDENCE SUMMARY:\n${JSON.stringify(evidenceSummary, null, 2)}\n\nMERCHANT'S ORIGINAL CLAIM:\n${merchantClaim}\n\nPresent the strongest honest case for the merchant.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        model: 'qwen/qwen3.8-27b',
        temperature: 0.2,
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


