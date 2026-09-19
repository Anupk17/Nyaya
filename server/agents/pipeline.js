const evidenceAgent = require('./evidence');
const merchantAgent = require('./merchant');
const customerAgent = require('./customer');
const judgeAgent = require('./judge');

/**
 * Run the full 4-agent pipeline for a dispute case.
 * 
 * @param {object} transaction - The transaction record
 * @param {object} dispute - The dispute record
 * @param {function} onStep - Callback called after each agent completes: (stepIndex, agentName, output) => void
 * @returns {object} The final verdict with all agent outputs
 */
async function runPipeline(transaction, dispute, options = {}, onStep = () => {}) {
  const agentOutputs = [];

  // Step 1: Evidence Agent
  onStep(0, 'evidence', null); // signal start
  let evidenceResult;
  try {
    evidenceResult = await evidenceAgent.run(transaction, dispute, options);
  } catch (e) {
    evidenceResult = { facts_established: ["Dispute filed"], missing_evidence: [], timeline: [], evidence_confidence: 50 };
  }
  const evidenceOutput = {
    agent: 'evidence',
    content: evidenceResult,
    timestamp: new Date().toISOString()
  };
  agentOutputs.push(evidenceOutput);
  onStep(1, 'evidence', evidenceOutput);

  // Step 2: Merchant Agent — delay to avoid Groq rate limit
  await new Promise(r => setTimeout(r, 1500));
  onStep(1, 'merchant', null); // signal start
  let merchantResult;
  try {
    merchantResult = await merchantAgent.run(evidenceResult, dispute.merchant_claim, dispute.id, options);
  } catch (e) {
    merchantResult = { merchant_verdict: "PARTIAL_SUPPORT", response_to_customer: "We followed our standard fulfillment process.", merchant_reasoning: "Rate limit fallback" };
  }
  const merchantOutput = {
    agent: 'merchant',
    content: merchantResult,
    timestamp: new Date().toISOString()
  };
  agentOutputs.push(merchantOutput);
  onStep(2, 'merchant', merchantOutput);

  // Step 3: Customer Agent — delay to avoid Groq rate limit
  await new Promise(r => setTimeout(r, 1500));
  onStep(2, 'customer', null); // signal start
  let customerResult;
  try {
    customerResult = await customerAgent.run(evidenceResult, dispute.customer_claim, dispute.id, options);
  } catch (e) {
    customerResult = { customer_verdict: "STRONG_SUPPORT", response_to_merchant: "I never received it as promised.", customer_reasoning: "Rate limit fallback" };
  }
  const customerOutput = {
    agent: 'customer',
    content: customerResult,
    timestamp: new Date().toISOString()
  };
  agentOutputs.push(customerOutput);
  onStep(3, 'customer', customerOutput);

  // Step 4: Judge Agent — delay to avoid Groq rate limit
  await new Promise(r => setTimeout(r, 1500));
  onStep(3, 'judge', null); // signal start
  let judgeResult;
  try {
    judgeResult = await judgeAgent.run(
      evidenceResult,
      merchantResult,
      customerResult,
      transaction.amount,
      dispute.id,
      options
    );
  } catch (e) {
    judgeResult = { verdict: "PARTIAL_REFUND", recommended_amount: transaction.amount * 0.5, confidence: 50, reasoning: "Rate limit fallback", fraud_flag: false };
  }
  
  // Build the full verdict
  const verdict = {
    dispute_id: dispute.id,
    decision: judgeResult.verdict,
    amount: judgeResult.recommended_amount,
    confidence: judgeResult.confidence,
    reasoning: judgeResult.reasoning,
    fraud_flag: judgeResult.fraud_flag || false,
    action_taken: determineAction(judgeResult.confidence, judgeResult.fraud_flag)
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

/**
 * Determine the action based on confidence score and fraud flag
 */
function determineAction(confidence, fraudFlag) {
  if (fraudFlag || confidence < 60) {
    return 'escalated';
  } else if (confidence >= 101) { // Intentionally impossible to force human approval for demo
    return 'auto_executed';
  } else {
    return 'pending_human_approval';
  }
}

module.exports = { runPipeline };
