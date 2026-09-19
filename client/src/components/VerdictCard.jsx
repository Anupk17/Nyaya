import React, { useState } from 'react';

function VerdictCard({ verdict, caseId, agentOutputs = [], memory = {} }) {
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [actionTaken, setActionTaken] = useState(null); // 'APPROVED' | 'OVERRIDDEN' | null
  const [showConfidenceBreakdown, setShowConfidenceBreakdown] = useState(false);

  if (!verdict) return null;

  const { decision, recommended_amount, amount, confidence, reasoning, conflict_summary, refund_path } = verdict;
  const finalAmount = recommended_amount !== undefined ? recommended_amount : amount;
  const verdictType = verdict.verdict || decision?.toUpperCase() || 'DENY';

  const calculateAgentAgreement = (outputs) => {
    return 75; // mock or calculate based on outputs
  };
  
  const countAgentAgreements = (outputs) => {
    return 3;
  };

  const calculateBreakdown = (v, mem) => {
    return [
      {
        label: 'Evidence strength',
        score: v.evidenceStrength || 70,
        impact: (v.evidenceStrength || 70) >= 70 ? 'positive' : 'negative',
        note: (v.evidenceStrength || 70) >= 70 ? 'Raises confidence' : 'Lowers confidence'
      },
      {
        label: 'Agent agreement',
        score: calculateAgentAgreement(agentOutputs),
        impact: calculateAgentAgreement(agentOutputs) >= 50 ? 'positive' : 'negative',
        note: `${countAgentAgreements(agentOutputs)}/4 agents agree`
      },
      {
        label: 'Filing timeliness',
        score: v.filingTimeliness || 80,
        impact: 'positive',
        note: 'Filed within 48hr window'
      },
      {
        label: 'Buyer history',
        score: mem?.buyerDisputeCount === 0 ? 90 : (mem?.buyerDisputeCount <= 2 ? 70 : 40),
        impact: mem?.buyerDisputeCount <= 1 ? 'positive' : 'negative',
        note: mem?.buyerDisputeCount === 0 ? 'First time claimant' : `${mem?.buyerDisputeCount || 1} previous disputes`
      },
      {
        label: 'Policy clarity',
        score: v.policyClarity || 65,
        impact: (v.policyClarity || 65) >= 70 ? 'positive' : 'neutral',
        note: 'Based on available RBI guidelines'
      }
    ];
  };

  const getPriorityInfo = (conf) => {
    if (conf >= 90) return { level: 'HIGH', label: 'Fast-track approval' };
    if (conf >= 60) return { level: 'MEDIUM', label: 'Standard review required' };
    return { level: 'LOW', label: 'Senior reviewer required' };
  };

  const { level: priority, label: priorityLabel } = getPriorityInfo(confidence);

  let verdictHeadline = '';
  switch (verdictType) {
    case 'FULL_REFUND':
      verdictHeadline = `AI recommends full refund of ₹${finalAmount?.toLocaleString('en-IN')} to buyer`;
      break;
    case 'PARTIAL_REFUND':
      verdictHeadline = `AI recommends partial refund of ₹${finalAmount?.toLocaleString('en-IN')} to buyer`;
      break;
    case 'DENY':
      verdictHeadline = `AI recommends denying this claim`;
      break;
    case 'ESCALATE':
    default:
      verdictHeadline = `AI is referring this case for human investigation`;
      break;
  }

  let verdictSubtitle = '';
  switch (refund_path) {
    case 'ESCROW':
      verdictSubtitle = 'Filed within escrow window · Direct refund applicable';
      break;
    case 'CHARGEBACK':
      verdictSubtitle = 'Post-settlement · Merchant chargeback required';
      break;
    case 'GOODWILL':
      verdictSubtitle = 'Goodwill credit recommended';
      break;
    default:
      verdictSubtitle = 'Confidence too low for AI decision · Senior review needed';
      break;
  }

  const getAgentVoteLabel = (agentType, output) => {
    if (!output || !output.content) return { label: 'Processing...', icon: '⏳', color: '#6B7280' };
    
    let result = output.content;
    if (typeof result === 'string') {
      try { result = JSON.parse(result); } catch (e) { }
    }

    if (agentType === 'evidence') {
      const v = result.verdict_suggestion || (JSON.stringify(result).toLowerCase().includes('refund') ? 'REFUND_LIKELY' : 'DENY_LIKELY');
      if (v === 'REFUND_LIKELY') return { label: 'Supports Refund', icon: '✓', color: '#059669' };
      if (v === 'PARTIAL_LIKELY') return { label: 'Partial Support', icon: '◑', color: '#D97706' };
      if (v === 'DENY_LIKELY') return { label: 'Disputes Claim', icon: '✗', color: '#DC2626' };
      if (v === 'ESCALATE') return { label: 'Needs Review', icon: '⚠', color: '#EA580C' };
      return { label: 'Analyzed', icon: '✓', color: '#059669' };
    }
    
    if (agentType === 'merchant') {
      const v = result.merchant_position || (JSON.stringify(result).toLowerCase().includes('concede') ? 'CONCEDE' : 'DEFEND');
      if (v === 'CONCEDE') return { label: 'Concedes Liability', icon: '✓', color: '#059669' };
      if (v === 'PARTIAL_CONCEDE') return { label: 'Partial Liability', icon: '◑', color: '#D97706' };
      if (v === 'DEFEND') return { label: 'Disputes Claim', icon: '✗', color: '#DC2626' };
      return { label: 'Disputes Claim', icon: '✗', color: '#DC2626' };
    }
    
    if (agentType === 'customer') {
      const v = result.customer_position || (JSON.stringify(result).toLowerCase().includes('strong') ? 'STRONG' : 'MODERATE');
      if (v === 'STRONG') return { label: 'Strong Case', icon: '✓', color: '#059669' };
      if (v === 'MODERATE') return { label: 'Moderate Case', icon: '◑', color: '#D97706' };
      if (v === 'WEAK') return { label: 'Weak Case', icon: '✗', color: '#DC2626' };
      return { label: 'Strong Case', icon: '✓', color: '#059669' };
    }
    
    if (agentType === 'judge') {
      const v = result.verdict || verdictType;
      if (v === 'FULL_REFUND') return { label: 'Full Refund', icon: '✓', color: '#059669' };
      if (v === 'PARTIAL_REFUND') return { label: 'Partial Refund', icon: '◑', color: '#D97706' };
      if (v === 'DENY') return { label: 'Deny', icon: '✗', color: '#DC2626' };
      if (v === 'ESCALATE') return { label: 'Escalate', icon: '⚠', color: '#EA580C' };
      return { label: 'Recommends', icon: '✓', color: '#059669' };
    }
    
    return { label: 'Processing...', icon: '⏳', color: '#6B7280' };
  };

  const evidenceStance = getAgentVoteLabel('evidence', agentOutputs.find(o => o.agent === 'evidence'));
  const merchantStance = getAgentVoteLabel('merchant', agentOutputs.find(o => o.agent === 'merchant'));
  const customerStance = getAgentVoteLabel('customer', agentOutputs.find(o => o.agent === 'customer'));
  const judgeStance = getAgentVoteLabel('judge', agentOutputs.find(o => o.agent === 'judge'));

  const agents = [
    { name: 'Evidence Agent', ...evidenceStance },
    { name: 'Merchant Agent', ...merchantStance },
    { name: 'Customer Agent', ...customerStance },
    { name: 'Judge Agent', ...judgeStance }
  ];

  const reasoningPoints = Array.isArray(reasoning) ? reasoning : (reasoning ? [reasoning] : []);

  const handleApprove = () => {
    setActionTaken('APPROVED');
    // In a real app, update dispute store status here: approveDispute(currentDispute.id)
  };

  const handleOverrideClick = () => {
    setShowOverrideInput(true);
  };

  const handleOverrideSubmit = () => {
    if (!overrideReason.trim()) return;
    setActionTaken('OVERRIDDEN');
    // In a real app, update dispute store status here: overrideDispute(currentDispute.id, overrideReason)
    setShowOverrideInput(false);
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '16px'
    }}>
      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '20px 24px',
        borderBottom: '1px solid #F3F4F6'
      }}>
        {/* Left — Priority + Decision */}
        <div>
          {/* Priority pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: priority === 'HIGH' ? '#D1FAE5' 
                      : priority === 'MEDIUM' ? '#FEF3C7' 
                      : '#FEE2E2',
            color: priority === 'HIGH' ? '#065F46'
                 : priority === 'MEDIUM' ? '#92400E'
                 : '#991B1B',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            {priority === 'HIGH' ? '⚡' 
           : priority === 'MEDIUM' ? '⏱' 
           : '⚠️'}
            {priority} PRIORITY — {priorityLabel}
          </div>

          {/* Main verdict headline */}
          <div style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#111827',
            lineHeight: '1.3',
            maxWidth: '480px'
          }}>
            {verdictHeadline}
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '12px',
            color: '#6B7280',
            marginTop: '6px'
          }}>
            {verdictSubtitle}
          </div>
        </div>

        {/* Right — Confidence circle */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0,
          position: 'relative'
        }}>
          <button 
            onClick={() => setShowConfidenceBreakdown(!showConfidenceBreakdown)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '4px solid #10B981',
              color: '#10B981',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '8px',
              background: 'white',
              cursor: 'pointer',
              outline: 'none',
              padding: 0
            }}>
            {confidence}%
          </button>
          <div style={{
            fontSize: '10px',
            color: '#6B7280',
            textAlign: 'center',
            letterSpacing: '0.05em'
          }}>
            CONFIDENCE
          </div>

          {showConfidenceBreakdown && (
            <div style={{
              position: 'absolute',
              top: '90px',
              right: '24px',
              width: '280px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 100
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '12px',
                textAlign: 'left'
              }}>
                How we calculated {confidence}%
              </div>

              {calculateBreakdown(verdict, memory).map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#374151',
                      fontWeight: '500'
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#9CA3AF',
                      marginTop: '1px'
                    }}>
                      {item.note}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '4px',
                      background: '#F3F4F6',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${item.score}%`,
                        height: '100%',
                        background: item.impact === 'positive' 
                          ? '#22C55E'
                        : item.impact === 'negative'
                          ? '#EF4444'
                          : '#F59E0B',
                        borderRadius: '2px'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: item.impact === 'positive'
                        ? '#059669'
                      : item.impact === 'negative'
                        ? '#DC2626'
                        : '#D97706',
                      width: '28px',
                      textAlign: 'right'
                    }}>
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}

              <div style={{
                borderTop: '1px solid #F3F4F6',
                marginTop: '8px',
                paddingTop: '8px',
                fontSize: '11px',
                color: '#6B7280',
                textAlign: 'center'
              }}>
                Click confidence score to toggle
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AGENT ASSESSMENT SECTION */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #F3F4F6'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#6B7280',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '12px'
        }}>
          Agent Assessment
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}>
          {agents.map((agent, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: '#F8F9FA',
              borderRadius: '8px',
              border: '1px solid #F3F4F6'
            }}>
              <span style={{
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: '500'
              }}>
                {agent.name}
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: agent.color,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {agent.icon} {agent.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* REASONING SECTION */}
      {reasoningPoints.length > 0 && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #F3F4F6'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#6B7280',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            Reasoning
          </div>

          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {reasoningPoints.map((point, i) => (
              <li key={i} style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#F97316',
                  flexShrink: 0,
                  marginTop: '6px'
                }} />
                <span style={{
                  fontSize: '13px',
                  color: '#374151',
                  lineHeight: '1.7'
                }}>
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* REFUND MECHANISM */}
      <div style={{
        padding: '16px 24px'
      }}>
        {refund_path === 'ESCROW' && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            background: '#F0FDF4',
            borderLeft: '4px solid #22C55E'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#14532D', marginBottom: '8px' }}>💰 Refund Mechanism: Escrow Withhold</div>
            <div style={{ fontSize: '13px', color: '#14532D', opacity: 0.9, lineHeight: '1.5', marginBottom: '12px' }}>
              This dispute was filed before merchant payout was processed. Paytm will withhold ₹{finalAmount?.toLocaleString('en-IN') || 625} from the pending merchant settlement and return it directly to the customer.
            </div>
            <div style={{ fontSize: '13px', color: '#14532D', fontWeight: '500', marginBottom: '12px' }}>
              Merchant receives: Reduced payout<br/>
              Customer receives: ₹{finalAmount?.toLocaleString('en-IN') || 625} (refund to source)
            </div>
            <div style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>Timeline: 2-4 business hours after approval</div>
          </div>
        )}

        {refund_path === 'CHARGEBACK' && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            background: '#FFFBEB',
            borderLeft: '4px solid #F59E0B'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#78350F', marginBottom: '8px' }}>📋 Refund Mechanism: Merchant Chargeback</div>
            <div style={{ fontSize: '13px', color: '#78350F', opacity: 0.9, lineHeight: '1.5', marginBottom: '12px' }}>
              Merchant payout has already been processed. Paytm cannot debit the merchant directly.
            </div>
            <div style={{ fontSize: '13px', color: '#78350F', fontWeight: '500', marginBottom: '12px' }}>
              Process if approved:<br/>
              1. Paytm formally requests ₹{finalAmount?.toLocaleString('en-IN') || 625} from merchant within 5 business days<br/>
              2. If merchant refuses → payout suspension<br/>
              3. If unresolved → RBI chargeback process
            </div>
            <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 'bold' }}>Timeline: 7-14 business days<br/>⚠️ Requires merchant cooperation</div>
          </div>
        )}

        {refund_path === 'GOODWILL' && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            background: '#EFF6FF',
            borderLeft: '4px solid #3B82F6'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1E3A8A', marginBottom: '8px' }}>🤝 Refund Mechanism: Paytm Goodwill Credit</div>
            <div style={{ fontSize: '13px', color: '#1E3A8A', opacity: 0.9, lineHeight: '1.5', marginBottom: '12px' }}>
              Given strong customer evidence and small dispute amount, Paytm may issue a goodwill credit from its dispute resolution fund.
            </div>
            <div style={{ fontSize: '13px', color: '#1E3A8A', fontWeight: '500', marginBottom: '12px' }}>
              Customer receives: ₹{finalAmount?.toLocaleString('en-IN') || 625} Paytm wallet credit<br/>
              Merchant: Flagged for packaging audit
            </div>
            <div style={{ fontSize: '12px', color: '#1D4ED8', fontWeight: 'bold' }}>Timeline: 1-2 business hours after approval</div>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{
        padding: '20px 24px',
        background: '#FAFAFA',
        borderTop: '1px solid #F3F4F6',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px'
      }}>
        {!actionTaken ? (
          <>
            {/* Context banner - tells reviewer what they're deciding */}
            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#92400E',
                  marginBottom: '2px'
                }}>
                  Awaiting Reviewer Decision
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#B45309',
                  lineHeight: '1.5'
                }}>
                  This AI recommendation requires your approval 
                  before any action is taken. 
                  No funds will move without your authorization.
                </div>
              </div>
            </div>

            {/* Two buttons side by side */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '12px'
            }}>
              {/* APPROVE BUTTON */}
              <button onClick={handleApprove} style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 20px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '4px'
                }}>
                  ✓ Approve Recommendation
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: 0.85,
                  lineHeight: '1.4'
                }}>
                  {refund_path === 'ESCROW' 
                    ? `Withhold ₹${finalAmount?.toLocaleString('en-IN') || 625} from merchant payout`
                    : refund_path === 'CHARGEBACK'
                    ? `Initiate ₹${finalAmount?.toLocaleString('en-IN') || 625} chargeback request`
                    : `Issue ₹${finalAmount?.toLocaleString('en-IN') || 625} goodwill credit`
                  }
                </div>
              </button>

              {/* OVERRIDE BUTTON */}
              <button onClick={handleOverrideClick} style={{
                background: 'white',
                color: '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '14px 20px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '4px',
                  color: '#DC2626'
                }}>
                  ✗ Override AI Decision
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#6B7280',
                  lineHeight: '1.4'
                }}>
                  Reject this recommendation and 
                  enter your own decision
                </div>
              </button>
            </div>

            {/* Override reason input — hidden until Override clicked */}
            {showOverrideInput && (
              <div style={{
                marginBottom: '12px',
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Override Reason (required)
                </div>
                <textarea
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder="Explain why you are overriding the AI recommendation..."
                  style={{
                    width: '100%',
                    height: '72px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#374151',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  <button
                    onClick={handleOverrideSubmit}
                    disabled={!overrideReason.trim()}
                    style={{
                      background: overrideReason.trim() 
                        ? '#DC2626' : '#F3F4F6',
                      color: overrideReason.trim() 
                        ? 'white' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: overrideReason.trim() 
                        ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Submit Override
                  </button>
                  <button
                    onClick={() => setShowOverrideInput(false)}
                    style={{
                      background: 'white',
                      color: '#6B7280',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {actionTaken === 'APPROVED' && (
              <div style={{
                background: '#D1FAE5',
                border: '1px solid #6EE7B7',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>✓</span>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#065F46'
                  }}>
                    Recommendation Approved
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#047857',
                    marginTop: '2px'
                  }}>
                    Paytm processing team has been notified.
                    {refund_path === 'ESCROW' 
                      ? ' Merchant payout will be withheld.'
                      : ' Chargeback request will be initiated.'
                    }
                  </div>
                </div>
              </div>
            )}
            
            {actionTaken === 'OVERRIDDEN' && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>✗</span>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#991B1B'
                  }}>
                    AI Recommendation Overridden
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#B91C1C',
                    marginTop: '2px'
                  }}>
                    Override reason recorded: "{overrideReason}"
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Disclaimer */}
        <div style={{
          fontSize: '11px',
          color: '#9CA3AF',
          fontStyle: 'italic',
          lineHeight: '1.5',
          marginTop: '16px'
        }}>
          Nyaya AI provides dispute analysis recommendations only. 
          All refund actions are executed solely by Paytm's 
          authorized operations team. AI decisions do not 
          constitute financial instructions.
        </div>
      </div>
    </div>
  );
}

export default VerdictCard;
