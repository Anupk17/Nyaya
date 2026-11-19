const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// In-memory cache of data (loaded from JSON files)
let transactions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'transactions.json'), 'utf-8'));
let disputes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'disputes.json'), 'utf-8'));
let resolutions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'resolutions.json'), 'utf-8'));

function reloadData() {
  transactions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'transactions.json'), 'utf-8'));
  disputes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'disputes.json'), 'utf-8'));
  resolutions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'resolutions.json'), 'utf-8'));
}

function saveDisputes() {
  fs.writeFileSync(path.join(DATA_DIR, 'disputes.json'), JSON.stringify(disputes, null, 2));
}

function saveResolutions() {
  fs.writeFileSync(path.join(DATA_DIR, 'resolutions.json'), JSON.stringify(resolutions, null, 2));
}

/**
 * Get a case (dispute + associated transaction)
 */
function getCase(caseId) {
  const dispute = disputes.find(d => d.id === caseId);
  if (!dispute) return null;
  const transaction = transactions.find(t => t.id === dispute.transaction_id);
  return { dispute, transaction };
}

/**
 * Get all cases with summary info
 */
function getAllCases() {
  return disputes.map(dispute => {
    const transaction = transactions.find(t => t.id === dispute.transaction_id);
    return {
      id: dispute.id,
      transaction_id: dispute.transaction_id,
      customer_name: transaction?.customer_name || 'Unknown',
      merchant_name: transaction?.merchant_name || 'Unknown',
      amount: transaction?.amount || 0,
      currency: transaction?.currency || 'INR',
      item_description: transaction?.item_description || '',
      filed_at: dispute.filed_at,
      filed_by: dispute.filed_by,
      status: dispute.status,
      customer_claim: dispute.customer_claim,
      merchant_claim: dispute.merchant_claim
    };
  });
}

/**
 * Mock: Issue a refund for a transaction
 */
function issueRefund(transactionId, amount) {
  const txn = transactions.find(t => t.id === transactionId);
  if (!txn) return { success: false, error: 'Transaction not found' };
  txn.status = 'refunded';
  txn.refund_amount = amount;
  txn.refunded_at = new Date().toISOString();
  return { success: true, transaction: txn };
}

/**
 * Mock: Reject a dispute claim
 */
function rejectClaim(caseId) {
  const dispute = disputes.find(d => d.id === caseId);
  if (!dispute) return { success: false, error: 'Case not found' };
  dispute.status = 'resolved';
  dispute.resolution = 'denied';
  dispute.resolved_at = new Date().toISOString();
  saveDisputes();
  return { success: true, dispute };
}

/**
 * Mock: Escalate a case
 */
function escalateCase(caseId, reason) {
  const dispute = disputes.find(d => d.id === caseId);
  if (!dispute) return { success: false, error: 'Case not found' };
  dispute.status = 'escalated';
  dispute.escalation_reason = reason;
  dispute.escalated_at = new Date().toISOString();
  saveDisputes();
  return { success: true, dispute };
}

/**
 * Mock: Update dispute status to resolved
 */
function resolveCase(caseId) {
  const dispute = disputes.find(d => d.id === caseId);
  if (!dispute) return { success: false, error: 'Case not found' };
  dispute.status = 'resolved';
  dispute.resolved_at = new Date().toISOString();
  saveDisputes();
  return { success: true, dispute };
}

/**
 * Log a decision to the audit trail
 */
function logDecision(caseId, verdict, agentOutputs) {
  const entry = {
    case_id: caseId,
    verdict,
    agent_outputs: agentOutputs,
    timestamp: new Date().toISOString()
  };
  resolutions.push(entry);
  saveResolutions();
  return entry;
}

/**
 * Get resolution for a specific case
 */
function getResolution(caseId) {
  return resolutions.filter(r => r.case_id === caseId);
}

/**
 * Get all resolutions
 */
function getAllResolutions() {
  return resolutions;
}

/**
 * Get aggregate stats
 */
function getStats() {
  const total = disputes.length;
  const pending = disputes.filter(d => d.status === 'pending').length;
  const resolved = disputes.filter(d => d.status === 'resolved').length;
  const escalated = disputes.filter(d => d.status === 'escalated').length;

  const completedResolutions = resolutions.filter(r => r.verdict);
  const avgConfidence = completedResolutions.length > 0
    ? Math.round(completedResolutions.reduce((sum, r) => sum + (r.verdict.confidence || 0), 0) / completedResolutions.length)
    : 0;

  const autoResolved = completedResolutions.filter(r => r.verdict.action_taken === 'auto_executed').length;
  const humanReview = completedResolutions.filter(r => r.verdict.action_taken === 'pending_human_approval').length;
  const escalatedCount = completedResolutions.filter(r => r.verdict.action_taken === 'escalated').length;

  // Rough time-saved estimate: 45 min per case manually, ~2 min with AI
  const timeSavedMinutes = completedResolutions.length * 43;

  return {
    total_cases: total,
    pending,
    resolved,
    escalated,
    completed_resolutions: completedResolutions.length,
    avg_confidence: avgConfidence,
    auto_resolved: autoResolved,
    human_review: humanReview,
    escalated_resolutions: escalatedCount,
    time_saved_minutes: timeSavedMinutes,
    total_amount_disputed: disputes.reduce((sum, d) => {
      const txn = transactions.find(t => t.id === d.transaction_id);
      return sum + (txn?.amount || 0);
    }, 0)
  };
}

/**
 * Dynamically create a custom dispute and transaction
 */
function createCase(data) {
  const caseId = data.id || `PTM-${Math.floor(10000 + Math.random() * 90000)}`;
  const txnId = data.transaction_id || `TXN-${Math.floor(10000 + Math.random() * 90000)}`;

  const newTxn = {
    id: txnId,
    customer_id: data.customer_id || 'CUST-LIVE',
    customer_name: data.customer_name || 'Live User',
    customer_email: data.customer_email || 'user@example.com',
    customer_phone: data.customer_phone || '+91 98765 43210',
    merchant_id: data.merchant_id || 'MERCH-LIVE',
    merchant_name: data.merchant_name || 'Retail Partner',
    merchant_category: data.merchant_category || 'E-Commerce',
    amount: Number(data.amount) || 1000,
    currency: 'INR',
    payment_method: data.payment_method || 'UPI',
    item_description: data.item_description || data.product_name || 'Disputed Item',
    transaction_date: data.transaction_date || new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'completed',
    delivery_partner: data.delivery_partner || 'BlueDart Logistics',
    delivery_status: data.delivery_status || 'Delivered'
  };

  const newDispute = {
    id: caseId,
    transaction_id: txnId,
    filed_by: 'customer',
    filed_at: new Date().toISOString(),
    customer_claim: data.customer_claim || data.description || '',
    merchant_claim: data.merchant_claim || 'The order was processed and dispatched per standard marketplace terms.',
    proof_attachments: data.proof_attachments || [],
    chat_log: data.chat_log || [],
    merchant_dispute_history_count: Number(data.merchant_dispute_history_count) || 1,
    status: 'pending'
  };

  transactions.unshift(newTxn);
  disputes.unshift(newDispute);
  
  fs.writeFileSync(path.join(DATA_DIR, 'transactions.json'), JSON.stringify(transactions, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'disputes.json'), JSON.stringify(disputes, null, 2));

  return { dispute: newDispute, transaction: newTxn };
}

module.exports = {
  getCase,
  getAllCases,
  createCase,
  issueRefund,
  rejectClaim,
  escalateCase,
  resolveCase,
  logDecision,
  getResolution,
  getAllResolutions,
  getStats,
  reloadData
};
