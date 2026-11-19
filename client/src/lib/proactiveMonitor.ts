export interface ProactiveAlert {
  id: string
  type: 'DEADLINE_URGENT' | 'HIGH_VALUE' | 'REPEAT_CUSTOMER' | 'AGENT_CONFLICT' | 'STAGE_ESCALATED' | 'FRAUD_PATTERN'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  caseId: string
  title: string
  message: string
  actionRequired: string
  timestamp: Date
  dismissed: boolean
}

export function runMonitoringChecks(
  disputes: any[]
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = []
  const now = new Date()

  if (!disputes || !Array.isArray(disputes)) return alerts

  disputes.forEach(dispute => {
    const id = dispute.dispute_id || dispute.id || 'unknown'
    const amount = parseFloat(dispute.dispute_amount || dispute.amount || 0)
    const stage = dispute.dispute_type || dispute.stage || 'DISPUTE'
    const status = dispute.dispute_status || dispute.status || 'ACTION_REQUIRED'
    const customerName = dispute.customer_details?.customer_name || dispute.buyerName || 'Customer'
    const isRepeat = dispute.customer_details?.is_repeat_customer
    const respondBy = dispute.respond_by ? new Date(dispute.respond_by) : null
    const verdict = dispute.latest_verdict || dispute.aiVerdict

    // TRIGGER 1: Deadline < 24h and no action taken yet
    if (respondBy && status === 'ACTION_REQUIRED') {
      const msLeft = respondBy.getTime() - now.getTime()
      const hoursLeft = msLeft / (1000 * 3600)

      if (hoursLeft < 24 && hoursLeft > -48) {
        alerts.push({
          id: `deadline-${id}`,
          type: 'DEADLINE_URGENT',
          severity: hoursLeft < 12 ? 'CRITICAL' : 'HIGH',
          caseId: id,
          title: `CRITICAL: < 24h Deadline on ${id}`,
          message: `Only ${Math.max(0, Math.floor(hoursLeft))}h remaining to respond to Cashfree. Contesting is impossible after the response deadline expires!`,
          actionRequired: 'Review evidence pack and execute CONTEST or REFUND immediately.',
          timestamp: now,
          dismissed: false
        })
      }
    }

    // TRIGGER 2: High value dispute (> Rs 10,000)
    if (amount >= 10000 && status === 'ACTION_REQUIRED') {
      alerts.push({
        id: `highvalue-${id}`,
        type: 'HIGH_VALUE',
        severity: 'HIGH',
        caseId: id,
        title: `High-Value Exposure: ₹${amount.toLocaleString()}`,
        message: `Dispute ${id} represents ₹${amount.toLocaleString()} at risk. Requires priority ops review and complete evidence submission.`,
        actionRequired: 'Inspect delivery proof and coordinate with senior ops reviewer.',
        timestamp: now,
        dismissed: false
      })
    }

    // TRIGGER 3: Repeat Customer (Cognee / History Flag)
    if (isRepeat && status === 'ACTION_REQUIRED') {
      alerts.push({
        id: `repeat-${id}`,
        type: 'REPEAT_CUSTOMER',
        severity: 'MEDIUM',
        caseId: id,
        title: `Repeat Claimant: ${customerName}`,
        message: `Customer ${customerName} has prior dispute records in Cognee memory. Check for recurring claim behavior or pattern.`,
        actionRequired: 'Verify customer claim against previous dispute precedents.',
        timestamp: now,
        dismissed: false
      })
    }

    // TRIGGER 4: Stage Escalated (Chargeback -> Pre-Arbitration / Arbitration)
    if ((stage === 'PRE_ARBITRATION' || stage === 'ARBITRATION') && status === 'ACTION_REQUIRED') {
      alerts.push({
        id: `stage-${id}`,
        type: 'STAGE_ESCALATED',
        severity: 'CRITICAL',
        caseId: id,
        title: `Stage Escalation: ${stage}`,
        message: `Dispute ${id} has escalated to ${stage}. High network arbitration fees apply if contested unsuccessfully.`,
        actionRequired: 'Decide whether evidence justifies contesting at network arbitration level.',
        timestamp: now,
        dismissed: false
      })
    }

    // TRIGGER 5: Agents Disagree (Conflict Detected)
    if (verdict && (verdict.conflict_detected || verdict.conflict_summary)) {
      alerts.push({
        id: `conflict-${id}`,
        type: 'AGENT_CONFLICT',
        severity: 'MEDIUM',
        caseId: id,
        title: `Agent Conflict in ${id}`,
        message: verdict.conflict_summary || `Merchant Advocate and Cardholder Advocate reached conflicting positions for ${id}.`,
        actionRequired: 'Human ops review required to weigh conflicting arguments.',
        timestamp: now,
        dismissed: false
      })
    }
  })

  return alerts
}
