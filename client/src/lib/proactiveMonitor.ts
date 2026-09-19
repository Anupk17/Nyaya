export interface ProactiveAlert {
  id: string
  type: 'AGING_CASE' | 'FRAUD_PATTERN' | 
        'HIGH_VALUE' | 'AGENT_CONFLICT' | 
        'ESCROW_EXPIRING'
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

  disputes.forEach(dispute => {
    
    // CHECK 1: Aging pending case
    if (dispute.status === 'PENDING' && dispute.aiVerdict) {
      const minutesPending = (
        now.getTime() - new Date(dispute.filedAt).getTime()
      ) / 1000 / 60

      if (minutesPending > 30) {
        const hoursUntilEscrowClose = Math.max(
          0, 
          48 - (minutesPending / 60)
        )
        alerts.push({
          id: `aging-${dispute.id}`,
          type: 'AGING_CASE',
          severity: hoursUntilEscrowClose < 12 
            ? 'HIGH' : 'MEDIUM',
          caseId: dispute.id,
          title: `Case ${dispute.id} awaiting review`,
          message: `${dispute.productName} has been pending for ${Math.floor(minutesPending)} minutes. Escrow window closes in ~${Math.floor(hoursUntilEscrowClose)} hours. Post-escrow requires chargeback which takes 7-14 days.`,
          actionRequired: 'Review and approve or override before escrow window closes.',
          timestamp: now,
          dismissed: false
        })
      }
    }

    // CHECK 2: High value case
    if (dispute.amount >= 10000 && 
        dispute.status === 'PENDING' &&
        dispute.aiVerdict) {
      alerts.push({
        id: `highvalue-${dispute.id}`,
        type: 'HIGH_VALUE',
        severity: 'HIGH',
        caseId: dispute.id,
        title: `High-value dispute: ₹${dispute.amount.toLocaleString()}`,
        message: `${dispute.productName} (₹${dispute.amount.toLocaleString()}) from ${dispute.sellerName} exceeds standard threshold. RBI guidelines require enhanced verification for claims above ₹10,000.`,
        actionRequired: 'Assign to senior reviewer. Request additional evidence if needed.',
        timestamp: now,
        dismissed: false
      })
    }

    // CHECK 3: Agent conflict
    if (dispute.aiVerdict) {
      const evidenceVote = dispute.aiVerdict.agentVotes?.evidence
      const judgeVote = dispute.aiVerdict.verdict
      
      const isConflict = (
        evidenceVote === 'DENY_LIKELY' && 
        judgeVote === 'FULL_REFUND'
      ) || (
        evidenceVote === 'REFUND_LIKELY' && 
        judgeVote === 'DENY'
      )

      if (isConflict) {
        alerts.push({
          id: `conflict-${dispute.id}`,
          type: 'AGENT_CONFLICT',
          severity: 'MEDIUM',
          caseId: dispute.id,
          title: `Agent conflict in ${dispute.id}`,
          message: `Evidence Agent and Judge Agent reached opposite conclusions for ${dispute.productName}. This edge case requires human judgment.`,
          actionRequired: 'Manual review required. Do not auto-approve.',
          timestamp: now,
          dismissed: false
        })
      }
    }
  })

  // CHECK 4: Fraud pattern across all disputes
  const buyerDisputeCounts: Record<string, number> = {}
  disputes.forEach(d => {
    buyerDisputeCounts[d.buyerName] = 
      (buyerDisputeCounts[d.buyerName] || 0) + 1
  })

  Object.entries(buyerDisputeCounts).forEach(([buyer, count]) => {
    if (count >= 3) {
      const buyerCases = disputes.filter(
        d => d.buyerName === buyer
      )
      const latestCase = buyerCases[0]
      
      alerts.push({
        id: `fraud-${buyer.replace(' ', '-')}`,
        type: 'FRAUD_PATTERN',
        severity: count >= 5 ? 'CRITICAL' : 'HIGH',
        caseId: latestCase?.id || '',
        title: `Repeat claimant: ${buyer}`,
        message: `${buyer} has filed ${count} disputes. Pattern detected across: ${buyerCases.map(d => d.productName).join(', ')}.`,
        actionRequired: 'Cross-check all cases for coordinated fraud. Consider account review.',
        timestamp: now,
        dismissed: false
      })
    }
  })

  return alerts
}
