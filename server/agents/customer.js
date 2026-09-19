const Groq = require('groq-sdk');
const { bedrockClient } = require('../lib/aws');
const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const SYSTEM_PROMPT = `You represent the CUSTOMER in this dispute.
Given the evidence summary and the customer's original claim, make the strongest honest case for the customer's position.
Do not fabricate evidence that wasn't provided.
Acknowledge weaknesses if the evidence contradicts the customer's claim.

Return ONLY valid JSON with no preamble or explanation:
{
  "position": "string — the customer's overall argument",
  "supporting_points": ["string — each a specific point supporting the customer's case"]
}`;



async function run(evidenceSummary, customerClaim, disputeId, options = {}) {
  const userMessage = `EVIDENCE SUMMARY:\n${JSON.stringify(evidenceSummary, null, 2)}\n\nCUSTOMER'S ORIGINAL CLAIM:\n${customerClaim}\n\nPresent the strongest honest case for the customer.`;

  if (options.useBedrock) {
    try {
      console.log('Customer Agent: Using AWS Bedrock (Claude 3 Haiku)');
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
      console.warn('Customer Agent: Bedrock API unavailable or errored, using fallback:', e.message);
    }
  } else {
    const apiKey = process.env.GROQ_API_KEY_CUSTOMER || process.env.GROQ_API_KEY;
    if (apiKey && apiKey !== 'gsk_your_groq_api_key_here') {
      try {
        const groq = new Groq({ apiKey });
      const userMessage = `EVIDENCE SUMMARY:\n${JSON.stringify(evidenceSummary, null, 2)}\n\nCUSTOMER'S ORIGINAL CLAIM:\n${customerClaim}\n\nPresent the strongest honest case for the customer.`;

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


