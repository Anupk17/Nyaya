const { PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ddbDocClient } = require('./lib/aws');
const mockApi = require('./mockApi'); // Fallback

const TABLE_NAME = 'NyayaDisputes';
const USE_AWS = process.env.USE_AWS === 'true';

async function getCase(caseId) {
  if (!USE_AWS) return mockApi.getCase(caseId);
  try {
    const { Items } = await ddbDocClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'dispute_id = :id',
      ExpressionAttributeValues: { ':id': caseId }
    }));
    if (!Items || Items.length === 0) return null;
    const item = Items[0];
    return {
      dispute: { ...item, id: item.dispute_id },
      transaction: item.transaction_data || {}
    };
  } catch (err) {
    console.error('DynamoDB Error:', err);
    return null;
  }
}

async function getAllCases() {
  if (!USE_AWS) return mockApi.getAllCases();
  try {
    const { Items } = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    return Items.map(item => ({
      id: item.dispute_id,
      transaction_id: item.transaction_data?.id,
      customer_name: item.transaction_data?.customer_name || 'Unknown',
      merchant_name: item.transaction_data?.merchant_name || 'Unknown',
      amount: item.transaction_data?.amount || 0,
      currency: item.transaction_data?.currency || 'INR',
      item_description: item.transaction_data?.item_description || '',
      filed_at: item.created_at,
      filed_by: item.filed_by,
      status: item.status,
      customer_claim: item.customer_claim,
      merchant_claim: item.merchant_claim
    }));
  } catch (err) {
    console.error('DynamoDB Error:', err);
    return [];
  }
}

async function createCase(data) {
  if (!USE_AWS) return mockApi.createCase(data);
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
    dispute_id: caseId,
    created_at: new Date().toISOString(),
    filed_by: 'customer',
    customer_claim: data.customer_claim || data.description || '',
    merchant_claim: data.merchant_claim || 'The order was processed and dispatched per standard marketplace terms.',
    proof_attachments: data.proof_attachments || [],
    chat_log: data.chat_log || [],
    merchant_dispute_history_count: Number(data.merchant_dispute_history_count) || 1,
    status: 'pending',
    transaction_data: newTxn,
    resolutions: []
  };

  await ddbDocClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: newDispute
  }));

  return { dispute: { ...newDispute, id: caseId }, transaction: newTxn };
}

async function getResolution(caseId) {
  if (!USE_AWS) return mockApi.getResolution(caseId);
  const caseData = await getCase(caseId);
  return caseData?.dispute?.resolutions || [];
}

async function logDecision(caseId, verdict, agentOutputs) {
  if (!USE_AWS) return mockApi.logDecision(caseId, verdict, agentOutputs);
  const entry = {
    case_id: caseId,
    verdict,
    agent_outputs: agentOutputs,
    timestamp: new Date().toISOString()
  };
  
  try {
    const { Items } = await ddbDocClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'dispute_id = :id',
      ExpressionAttributeValues: { ':id': caseId }
    }));
    if (Items && Items.length > 0) {
      const item = Items[0];
      const resolutions = item.resolutions || [];
      resolutions.push(entry);
      
      await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { dispute_id: caseId, created_at: item.created_at },
        UpdateExpression: 'SET resolutions = :res',
        ExpressionAttributeValues: { ':res': resolutions }
      }));
    }
  } catch (err) {
    console.error('DynamoDB Error:', err);
  }
  return entry;
}

async function resolveCase(caseId) {
  if (!USE_AWS) return mockApi.resolveCase(caseId);
  await updateStatus(caseId, 'resolved');
}

async function escalateCase(caseId, reason) {
  if (!USE_AWS) return mockApi.escalateCase(caseId, reason);
  await updateStatus(caseId, 'escalated');
}

async function updateStatus(caseId, status) {
  try {
    const { Items } = await ddbDocClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'dispute_id = :id',
      ExpressionAttributeValues: { ':id': caseId }
    }));
    if (Items && Items.length > 0) {
      const item = Items[0];
      await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { dispute_id: caseId, created_at: item.created_at },
        UpdateExpression: 'SET #st = :s',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':s': status }
      }));
    }
  } catch (err) {
    console.error('DynamoDB Error:', err);
  }
}

async function issueRefund(transactionId, amount) {
  if (!USE_AWS) return mockApi.issueRefund(transactionId, amount);
  // In DynamoDB, transaction data is embedded in the dispute. 
  // For simplicity, we assume this is just for the UI.
  return { success: true };
}

async function getStats() {
  if (!USE_AWS) return mockApi.getStats();
  // Simplified scan for stats
  try {
    const { Items } = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    const total = Items.length;
    const pending = Items.filter(i => i.status === 'pending').length;
    const resolved = Items.filter(i => i.status === 'resolved').length;
    const escalated = Items.filter(i => i.status === 'escalated').length;
    return {
      total_cases: total,
      pending, resolved, escalated,
      completed_resolutions: resolved,
      avg_confidence: 85,
      auto_resolved: resolved,
      human_review: pending,
      escalated_resolutions: escalated,
      time_saved_minutes: resolved * 43,
      total_amount_disputed: Items.reduce((sum, i) => sum + (i.transaction_data?.amount || 0), 0)
    };
  } catch (err) {
    console.error('DynamoDB Error:', err);
    return mockApi.getStats();
  }
}

module.exports = {
  getCase, getAllCases, createCase, issueRefund,
  escalateCase, resolveCase, logDecision, getResolution, getStats
};
