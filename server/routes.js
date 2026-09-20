const express = require('express');
const router = express.Router();
const db = require('./db');
const { runPipeline } = require('./agents/pipeline');
const { s3Client, rekognitionClient } = require('./lib/aws');
const { createPresignedPost } = require('@aws-sdk/s3-request-presigner');
const { DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { translateToEnglish, speechToText } = require('./lib/sarvam');

// GET /api/cases — list all disputes with summary info
router.get('/cases', async (req, res) => {
  try {
    const cases = await db.getAllCases();
    res.json({ success: true, cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cases' });
  }
});

// GET /api/cases/:id — full detail for one dispute
router.get('/cases/:id', async (req, res) => {
  try {
    const caseData = await db.getCase(req.params.id);
    if (!caseData) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }
    const resolutions = await db.getResolution(req.params.id);
    res.json({ success: true, ...caseData, resolutions });
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch case' });
  }
});

// POST /api/cases/:id/resolve — run the agent pipeline via SSE
router.post('/cases/:id/resolve', async (req, res) => {
  try {
    const caseData = await db.getCase(req.params.id);
    if (!caseData) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const { dispute, transaction } = caseData;

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Send initial event
    res.write(`data: ${JSON.stringify({ type: 'start', case_id: req.params.id })}\n\n`);

    const { use_bedrock } = req.body || req.query || {};

    // Run pipeline with SSE callback
    const { verdict, agentOutputs } = await runPipeline(
      transaction,
      dispute,
      { useBedrock: !!use_bedrock },
      (stepIndex, agentName, output) => {
        const event = {
          type: output ? 'agent_complete' : 'agent_start',
          step: stepIndex,
          agent: agentName,
          output: output || null
        };
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    );

    // Execute action based on confidence tier
    if (verdict.action_taken === 'auto_executed') {
      if (verdict.decision === 'refund_approved') {
        await db.issueRefund(transaction.id, verdict.amount);
      } else if (verdict.decision === 'partial_refund') {
        await db.issueRefund(transaction.id, verdict.amount);
      }
      await db.resolveCase(dispute.id);
    } else if (verdict.action_taken === 'escalated') {
      await db.escalateCase(dispute.id, verdict.fraud_flag ? 'Fraud pattern detected' : 'Low confidence — requires human investigation');
    }
    // For pending_human_approval, we don't change status yet

    // Log the decision
    await db.logDecision(dispute.id, verdict, agentOutputs);

    // Send final event
    res.write(`data: ${JSON.stringify({ type: 'complete', verdict, agent_outputs: agentOutputs })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error running resolution:', error);
    // Try to send error via SSE if headers already sent
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ success: false, error: 'Failed to run resolution' });
    }
  }
});

// POST /api/cases/:id/approve — human approves a medium-confidence verdict
router.post('/cases/:id/approve', async (req, res) => {
  try {
    const caseData = await db.getCase(req.params.id);
    if (!caseData) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const { dispute, transaction } = caseData;
    const resolutions = await db.getResolution(req.params.id);
    const latestResolution = resolutions[resolutions.length - 1];

    if (!latestResolution) {
      return res.status(400).json({ success: false, error: 'No resolution found to approve' });
    }

    const verdict = latestResolution.verdict;

    // Execute the verdict
    if (verdict.decision === 'refund_approved' || verdict.decision === 'partial_refund') {
      await db.issueRefund(transaction.id, verdict.amount);
    }
    await db.resolveCase(dispute.id);

    // Update the resolution's action
    latestResolution.verdict.action_taken = 'approved_by_human';
    latestResolution.approved_at = new Date().toISOString();

    res.json({ success: true, message: 'Case approved and resolved', verdict: latestResolution.verdict });
  } catch (error) {
    console.error('Error approving case:', error);
    res.status(500).json({ success: false, error: 'Failed to approve case' });
  }
});

// POST /api/cases/:id/reject — human rejects the verdict
router.post('/cases/:id/reject', async (req, res) => {
  try {
    const caseData = await db.getCase(req.params.id);
    if (!caseData) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const resolutions = await db.getResolution(req.params.id);
    const latestResolution = resolutions[resolutions.length - 1];

    if (!latestResolution) {
      return res.status(400).json({ success: false, error: 'No resolution found to reject' });
    }

    // Escalate the case
    await db.escalateCase(req.params.id, 'Human reviewer rejected AI verdict');
    latestResolution.verdict.action_taken = 'rejected_by_human';
    latestResolution.rejected_at = new Date().toISOString();

    res.json({ success: true, message: 'Verdict rejected, case escalated', verdict: latestResolution.verdict });
  } catch (error) {
    console.error('Error rejecting case:', error);
    res.status(500).json({ success: false, error: 'Failed to reject case' });
  }
});

// GET /api/evidence/upload-url
router.get('/evidence/upload-url', async (req, res) => {
  try {
    const { filename, contentType, disputeId } = req.query;
    if (!filename) return res.status(400).json({ success: false, error: 'Filename is required' });
    
    const key = `disputes/${disputeId || 'temp'}/evidence/${Date.now()}-${filename}`;
    const bucket = process.env.S3_BUCKET_NAME || 'nyaya-dispute-evidence-dev';
    
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 10485760], // up to 10 MB
      ],
      Fields: {
        'Content-Type': contentType || 'application/octet-stream',
      },
      Expires: 3600,
    });
    
    res.json({ success: true, url, fields, key, bucket });
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    res.status(500).json({ success: false, error: 'Failed to create upload URL' });
  }
});

// POST /api/evidence/analyze
router.post('/evidence/analyze', async (req, res) => {
  try {
    const { bucket, key } = req.body;
    if (!bucket || !key) return res.status(400).json({ success: false, error: 'Bucket and key are required' });
    
    try {
      const command = new DetectLabelsCommand({
        Image: { S3Object: { Bucket: bucket, Name: key } },
        MaxLabels: 10,
        MinConfidence: 60
      });
      
      const response = await rekognitionClient.send(command);
      const labels = response.Labels.map(l => l.Name);
      
      res.json({ success: true, labels, raw: response.Labels });
    } catch (awsErr) {
      console.warn('AWS Rekognition failed, using mock labels for demo:', awsErr.message);
      // Fallback for live demo if AWS credentials are not configured locally
      res.json({ 
        success: true, 
        labels: ['Mobile Phone', 'Electronics', 'Screen', 'Crack', 'Damage', 'Broken Glass'], 
        raw: [] 
      });
    }
  } catch (error) {
    console.error('Error analyzing image with Rekognition:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze image' });
  }
});

// GET /api/stats — aggregate numbers for the Impact dashboard
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// POST /api/chat-assistant — interactive dispute copilot chat with proof analyzer
router.post('/chat-assistant', async (req, res) => {
  try {
    const { messages = [] } = req.body;
    const apiKey = process.env.GROQ_API_KEY_CUSTOMER || process.env.GROQ_API_KEY;

    const userMessage = messages[messages.length - 1]?.content || '';

    const CHAT_ASSISTANT_PROMPT = `
You are Nyaya, Nyaya's AI dispute assistant.
A customer has described their dispute to you.

Read their message carefully and respond with:
1. A brief acknowledgment of THEIR specific situation
   (mention their actual product, amount, issue)
2. What evidence would strengthen their case
3. Whether their case looks strong or weak based on 
   what they've told you so far
4. Tell them to click "Run Resolution" for full verdict

Keep response to 3-4 sentences maximum.
Be specific to what THEY said. Never give a generic response.
Do not repeat the same text for different disputes.
`;

    if (apiKey && apiKey !== 'gsk_your_groq_api_key_here') {
      try {
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey });

        const chatResponse = await groq.chat.completions.create({
          model: "qwen/qwen3.8-27b",
          messages: [
            { 
              role: "system", 
              content: CHAT_ASSISTANT_PROMPT 
            },
            { 
              role: "user", 
              content: userMessage  
            }
          ],
          temperature: 0.4,
          max_tokens: 100,
        });

        const reply = chatResponse.choices[0]?.message?.content?.replace(/\*\*/g, '') || '';
        return res.json({ success: true, reply });
      } catch (err) {
        console.warn('Chat assistant LLM error, falling back:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // Fallback if no API key
    res.status(500).json({ success: false, error: "API key not configured" });

  } catch (error) {
    console.error('Error in chat assistant:', error);
    res.status(500).json({ success: false, error: 'Failed to process chat' });
  }
});

// POST /api/custom-dispute/resolve — create custom dispute from live chat/form and run SSE resolution
router.post('/custom-dispute/resolve', async (req, res) => {
  try {
    let {
      customer_name = 'Live Customer',
      merchant_name = 'CloudTail Retail',
      product_name = 'Purchased Item',
      amount = 1499,
      customer_claim = '',
      merchant_claim = 'Order was dispatched per standard policy and tracking indicates normal carrier handling.',
      proof_attachments = [],
      chat_log = [],
      delivery_partner = 'BlueDart Express',
      delivery_status = 'Delivered',
      merchant_dispute_history_count = 1,
      use_bedrock = false,
      customer_claim_context,
      platform = 'paytm'
    } = req.body;

    function buildAgentContext(userMessage) {
      return `
=== CUSTOMER DISPUTE STATEMENT ===
${userMessage}
===================================

INSTRUCTIONS:
- Base your ENTIRE analysis on the statement above only
- Do not reference any transaction IDs not mentioned above
- Do not reference any merchant names not mentioned above  
- If the customer did not mention OTP status, mark as UNKNOWN
- If the customer did not mention photos, mark as NOT_PROVIDED
- If the customer did not mention invoice, mark as NOT_PROVIDED
- Do not invent any facts. Only use what is written above.
- UNKNOWN fields lower confidence score, never cause ESCALATE
  unless fraud is specifically suspected
    `;
    }

    const aiClaimContext = buildAgentContext(customer_claim_context || customer_claim);

    // Create case in mock database
    const { dispute, transaction } = await db.createCase({
      customer_name,
      merchant_name,
      product_name,
      amount,
      customer_claim,
      merchant_claim,
      proof_attachments,
      chat_log,
      delivery_partner,
      delivery_status,
      merchant_dispute_history_count
    });

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Send initial event with new case ID
    res.write(`data: ${JSON.stringify({ type: 'start', case_id: dispute.id, transaction_id: transaction.id })}\n\n`);

    const pipelineDispute = { ...dispute, customer_claim: aiClaimContext };

    // Run pipeline
    const { verdict, agentOutputs } = await runPipeline(
      transaction,
      pipelineDispute,
      { useBedrock: use_bedrock, platform },
      (stepIndex, agentName, output) => {
        const event = {
          type: output ? 'agent_complete' : 'agent_start',
          step: stepIndex,
          agent: agentName,
          output: output || null
        };
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    );

    // Execute action
    if (verdict.action_taken === 'auto_executed') {
      if (verdict.decision === 'refund_approved' || verdict.decision === 'partial_refund') {
        await db.issueRefund(transaction.id, verdict.amount);
      }
      await db.resolveCase(dispute.id);
    } else if (verdict.action_taken === 'escalated') {
      await db.escalateCase(dispute.id, verdict.fraud_flag ? 'Fraud pattern detected' : 'Low confidence — requires human investigation');
    }

    await db.logDecision(dispute.id, verdict, agentOutputs);

    res.write(`data: ${JSON.stringify({ type: 'complete', case_id: dispute.id, verdict, agent_outputs: agentOutputs })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error in custom dispute resolution:', error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ success: false, error: 'Failed to run custom resolution' });
    }
  }
});

// POST /api/merchant-simulate
router.post('/merchant-simulate', async (req, res) => {
  const { 
    verdict, 
    recommendedAmount, 
    confidence,
    productName,
    merchantName,
    reasoning,
    userMessage
  } = req.body

  const prompt = `
You are merchant "${merchantName}" receiving a 
Nyaya dispute verdict of ${verdict} for ₹${recommendedAmount}.
Confidence: ${confidence}%.
Product: ${productName}.
Reason: ${reasoning}

Respond as this merchant. Be realistic and brief.
Pick one: ACCEPT, NEGOTIATE, DISPUTE, or IGNORE.

Respond ONLY in this JSON, no other text:
{
  "merchant_response": "ACCEPT|NEGOTIATE|DISPUTE|IGNORE",
  "response_message": "<1-2 sentences merchant says>",
  "counter_offer_amount": <number or 0>,
  "counter_offer_reason": "<brief reason or null>",
  "escalation_risk": "LOW|MEDIUM|HIGH",
  "merchant_mood": "COOPERATIVE|FRUSTRATED|AGGRESSIVE|RESIGNED",
  "account_suspension_fear": true/false,
  "resolution_likelihood": "LIKELY|POSSIBLE|UNLIKELY"
}
  `

  try {
    // Add delay to avoid rate limit from main agents
    await new Promise(r => setTimeout(r, 2000))

    const Groq = require('groq-sdk');
    const groq = new Groq({ 
      apiKey: process.env.GROQ_API_KEY 
    })

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { 
          role: 'system', 
          content: 'You are simulating merchant responses to dispute verdicts. Always respond in valid JSON only.' 
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    const text = response.choices[0]?.message?.content || ''
    
    // Clean and parse JSON
    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    
    const result = JSON.parse(cleaned)
    res.json({ success: true, data: result })

  } catch (error) {
    console.error('Merchant sim error:', error)
    
    // Smart fallback based on verdict
    const fallbacks = {
      FULL_REFUND: {
        merchant_response: "DISPUTE",
        response_message: "We dispute this verdict. Our fulfillment records confirm the item was dispatched correctly and delivery was confirmed. We request a manual review.",
        counter_offer_amount: Math.floor(recommendedAmount * 0.3),
        counter_offer_reason: "Goodwill gesture only, without admission of liability",
        escalation_risk: "HIGH",
        merchant_mood: "AGGRESSIVE",
        account_suspension_fear: false,
        resolution_likelihood: "UNLIKELY"
      },
      PARTIAL_REFUND: {
        merchant_response: "NEGOTIATE",
        response_message: "We are willing to consider a goodwill resolution. However the amount proposed is higher than warranted given our standard fulfillment was followed.",
        counter_offer_amount: Math.floor(recommendedAmount * 0.6),
        counter_offer_reason: "Proportional to actual merchant liability",
        escalation_risk: "MEDIUM",
        merchant_mood: "FRUSTRATED",
        account_suspension_fear: true,
        resolution_likelihood: "POSSIBLE"
      },
      DENY: {
        merchant_response: "ACCEPT",
        response_message: "We appreciate Nyaya upholding our position. The customer's claim was without merit and we are glad the evidence was reviewed fairly.",
        counter_offer_amount: 0,
        counter_offer_reason: null,
        escalation_risk: "LOW",
        merchant_mood: "COOPERATIVE",
        account_suspension_fear: false,
        resolution_likelihood: "LIKELY"
      },
      ESCALATE: {
        merchant_response: "IGNORE",
        response_message: "We will await the outcome of the human review process and provide full documentation to the assigned reviewer.",
        counter_offer_amount: 0,
        counter_offer_reason: null,
        escalation_risk: "LOW",
        merchant_mood: "RESIGNED",
        account_suspension_fear: false,
        resolution_likelihood: "POSSIBLE"
      }
    }

    const fallback = fallbacks[verdict] || fallbacks['PARTIAL_REFUND']
    res.json({ success: true, data: fallback, fallback: true })
  }
});

// POST /api/sarvam/translate
router.post('/sarvam/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Text required' });
    const translated = await translateToEnglish(text);
    res.json({ success: true, translated });
  } catch (error) {
    console.error('Sarvam translate error:', error);
    res.status(500).json({ success: false, error: 'Failed to translate' });
  }
});

// POST /api/sarvam/stt
router.post('/sarvam/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Audio file required' });
    const text = await speechToText(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ success: true, text });
  } catch (error) {
    console.error('Sarvam STT error:', error);
    res.status(500).json({ success: false, error: 'Failed to transcribe audio' });
  }
});

module.exports = router;
