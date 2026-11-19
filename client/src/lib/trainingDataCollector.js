const TRAINING_STORAGE_KEY = 'nyaya_training_data'

export function saveTrainingExample(
  dispute,
  agentContext,
  judgeResult,
  reviewerAction
) {
  try {
    const example = {
      id: dispute.id,
      timestamp: new Date().toISOString(),
      messages: [
        {
          role: 'system',
          content: `You are Nyaya, an autonomous AI dispute resolution judge. Analyze the dispute and return a verdict in exact JSON format. Apply RBI Consumer Protection Guidelines and standard e-commerce merchant agreements. Never move money autonomously — recommendations only.`
        },
        {
          role: 'user',
          content: agentContext
        },
        {
          role: 'assistant',
          content: JSON.stringify({
            verdict: judgeResult.verdict || judgeResult.decision,
            confidence: judgeResult.confidence,
            recommended_amount: judgeResult.recommendedAmount || judgeResult.amount,
            refund_percentage: judgeResult.refund_percentage,
            reasoning: Array.isArray(judgeResult.reasoning) ? judgeResult.reasoning.join('\n') : judgeResult.reasoning,
            action_type: judgeResult.action_type || judgeResult.action_taken,
            conflict_detected: judgeResult.conflict_detected,
            priority: judgeResult.priority
          }, null, 2)
        }
      ],
      metadata: {
        verdict: judgeResult.verdict || judgeResult.decision,
        confidence: judgeResult.confidence,
        amount: dispute.amount,
        wasOverridden: reviewerAction === 'OVERRIDDEN',
        reviewerApproved: reviewerAction === 'APPROVED',
        productCategory: categorizeProduct(dispute.productName || ''),
        otpStatus: extractOTPStatus(agentContext),
        filingTimeHours: calculateFilingTime(dispute)
      }
    }

    // Only save high quality examples
    // Skip if reviewer overrode (AI was wrong)
    // Removed confidence < 70 check for testing/demo purposes
    if (reviewerAction === 'APPROVED') {
      const existing = getTrainingData()
      existing.push(example)
      localStorage.setItem(
        TRAINING_STORAGE_KEY,
        JSON.stringify(existing)
      )
      console.log(
        `✓ Training example saved: ${dispute.id} (${existing.length} total)`
      )
    }
  } catch (err) {
    console.warn('Training data save failed:', err)
  }
}

export function getTrainingData() {
  try {
    return JSON.parse(
      localStorage.getItem(TRAINING_STORAGE_KEY) || '[]'
    )
  } catch { return [] }
}

export function exportAsJSONL() {
  return getTrainingData()
    .map(ex => JSON.stringify({ messages: ex.messages }))
    .join('\n')
}

export function exportAsCSV() {
  const data = getTrainingData()
  const headers = [
    'id', 'timestamp', 'verdict', 'confidence',
    'amount', 'approved', 'overridden', 
    'product_category', 'otp_status', 'filing_hours'
  ]
  const rows = data.map(ex => [
    ex.id,
    ex.timestamp,
    ex.metadata.verdict,
    ex.metadata.confidence,
    ex.metadata.amount,
    ex.metadata.reviewerApproved,
    ex.metadata.wasOverridden,
    ex.metadata.productCategory,
    ex.metadata.otpStatus,
    ex.metadata.filingTimeHours
  ])
  return [headers, ...rows]
    .map(r => r.join(','))
    .join('\n')
}

function categorizeProduct(name) {
  const n = name.toLowerCase()
  if (n.match(/phone|laptop|tablet|watch|earbuds|headphone|cable|charger/))
    return 'electronics'
  if (n.match(/kurta|saree|shirt|dress|shoes|jacket|clothing/))
    return 'fashion'
  if (n.match(/dinner|kitchen|home|decor|furniture/))
    return 'home'
  if (n.match(/book|pen|notebook/))
    return 'stationery'
  return 'other'
}

function extractOTPStatus(context) {
  if (!context) return 'unknown';
  if (context.toLowerCase().includes('otp confirmed')) 
    return 'confirmed'
  if (context.toLowerCase().includes('no otp')) 
    return 'not_found'
  return 'unknown'
}

function calculateFilingTime(dispute) {
  if (!dispute.filedAt) return 0
  return Math.round(
    (new Date().getTime() - new Date(dispute.filedAt).getTime()) / 1000 / 3600
  )
}
