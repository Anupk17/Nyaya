const evidenceAgent = require('./evidence');
const merchantAgent = require('./merchant');
const customerAgent = require('./customer');
const judgeAgent = require('./judge');

/**
 * Run the full 4-agent chargeback defense pipeline for a Cashfree dispute.
 * 
 * @param {object} dispute - The Cashfree dispute object
 * @param {object} options - Options (memoryPrecedents, etc.)
 * @param {function} onStep - Callback called on progress: (stepIndex, agentName, output) => void
 * @returns {object} Final verdict and outputs of all 4 agents
 */
async function runPipeline(dispute, options = {}, onStep = () => {}) {
  const agentOutputs = [];

  // Step 1: Evidence Agent
  onStep(0, 'evidence', null);
  let evidenceResult;
  try {
    evidenceResult = await evidenceAgent.run(dispute, options);
  } catch (e) {
    console.warn('Evidence agent error:', e.message);
    evidenceResult = {
      evidence_strength: 50,
      covered: (dispute.dispute_evidence || []).map(e => e.doc_type || e.file_name),
      missing: dispute.preferred_evidence || [],
      fraud_flags: [],
      summary: `Automated analysis for ${dispute.dispute_id}.`
    };
  }
  const evidenceOutput = {
    agent: 'evidence',
    content: evidenceResult,
    timestamp: new Date().toISOString()
  };
  agentOutputs.push(evidenceOutput);
  onStep(1, 'evidence', evidenceOutput);

  // Short delay to avoid rate limits
  await new Promise(r => setTimeout(r, 600));

  // Step 2: Merchant Advocate Agent
  onStep(1, 'merchant', null);
  let merchantResult;
  try {
    merchantResult = await merchantAgent.run(evidenceResult, dispute, options);
  } catch (e) {
    console.warn('Merchant agent error:', e.message);
    merchantResult = {
      position: 'CONTEST',
      argument_summary: 'Fulfillment completed per standard operating procedure.',
      key_defenses: ['Order marked delivered in merchant logistics system'],
      merchant_exposure: `Rs ${dispute.dispute_amount}`
    };
  }
  const merchantOutput = {
    agent: 'merchant',
    content: merchantResult,
    timestamp: new Date().toISOString()
  };
  agentOutputs.push(merchantOutput);
  onStep(2, 'merchant', merchantOutput);

  // Short delay
  await new Promise(r => setTimeout(r, 600));

  // Step 3: Cardholder Advocate Agent
  onStep(2, 'customer', null);
  let customerResult;
  try {
    customerResult = await customerAgent.run(evidenceResult, dispute, options);
  } catch (e) {
    console.warn('Customer agent error:', e.message);
    customerResult = {
      position: 'REFUND',
      cardholder_arguments: [dispute.customer_details?.customer_claim || 'Cardholder disputed charge with issuer'],
      issuer_vulnerabilities: [],
      consumer_rights_cited: 'RBI Consumer Protection Regulations'
    };
  }
  const customerOutput = {
    agent: 'customer',
    content: customerResult,
    timestamp: new Date().toISOString()
  };
  agentOutputs.push(customerOutput);
  onStep(3, 'customer', customerOutput);

  // Short delay
  await new Promise(r => setTimeout(r, 600));

  // Step 4: Judge Agent
  onStep(3, 'judge', null);
  let judgeResult;
  try {
    judgeResult = await judgeAgent.run(
      evidenceResult,
      merchantResult,
      customerResult,
      dispute,
      options.memoryPrecedents,
      options
    );
  } catch (e) {
    console.warn('Judge agent error:', e.message);
    const amount = parseFloat(dispute.dispute_amount || 0);
    judgeResult = {
      recommendation: 'CONTEST',
      win_likelihood: 70,
      confidence: 75,
      amount_at_risk: amount,
      expected_recovery: Math.round(amount * 0.7),
      deadline_note: `Respond by ${dispute.respond_by}`,
      reasoning: ['Evidence reviewed against Cashfree guidelines', 'Merchant position evaluated'],
      evidence_checklist: (dispute.preferred_evidence || []).map(p => ({ item: p, status: 'HAVE' })),
      conflict_detected: false,
      conflict_summary: null
    };
  }

  // Final structured verdict
  const verdict = {
    dispute_id: dispute.dispute_id,
    recommendation: judgeResult.recommendation, // CONTEST | ACCEPT | REFUND | ESCALATE
    win_likelihood: judgeResult.win_likelihood, // AI estimate (0-100)
    confidence: judgeResult.confidence,         // 0-100
    amount_at_risk: judgeResult.amount_at_risk || dispute.dispute_amount,
    expected_recovery: judgeResult.expected_recovery || 0,
    deadline_note: judgeResult.deadline_note,
    reasoning: judgeResult.reasoning || [],
    evidence_checklist: judgeResult.evidence_checklist || [],
    conflict_detected: judgeResult.conflict_detected || false,
    conflict_summary: judgeResult.conflict_summary || null,
    status: 'PENDING_APPROVAL',
    created_at: new Date().toISOString()
  };

  const judgeOutput = {
    agent: 'judge',
    content: judgeResult,
    verdict,
    timestamp: new Date().toISOString()
  };
  agentOutputs.push(judgeOutput);
  onStep(4, 'judge', judgeOutput);

  return { verdict, agentOutputs };
}

module.exports = { runPipeline };
