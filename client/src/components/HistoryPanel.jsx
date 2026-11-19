import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useDisputeStore } from '../store/disputeStore';

const RESULT_STYLES = {
  refund:    { background: 'rgba(34,197,94,0.15)',  color: '#22C55E' },
  partial:   { background: 'rgba(251,191,36,0.15)', color: '#F59E0B' },
  denied:    { background: 'rgba(239,68,68,0.15)',  color: '#EF4444' },
  escalated: { background: 'rgba(249,115,22,0.15)', color: '#F97316' },
  pending:   { background: 'rgba(255,255,255,0.1)', color: '#D1D5DB' },
};

export default function HistoryPanel({ onClearHistory }) {
  const { disputes } = useDisputeStore();

  const historyGroups = disputes.length > 0 ? [
    {
      category: 'Recent Deliberations',
      items: disputes.map(d => {
        return {
          id: d.id,
          dispute: d,
          path: `/case/${d.id}`
        };
      })
    }
  ] : [];

  return (
    <aside style={{
      width: 280,
      background: '#1C1C1E',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: 16,
      overflowY: 'auto',
      flexShrink: 0,
      borderLeft: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
          Dispute History
        </span>
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.8)',
          background: 'rgba(255,255,255,0.1)',
          padding: '2px 8px', borderRadius: 10,
        }}>
          {disputes.length}
        </span>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 4 }} />

      {/* Groups */}
      <div style={{ flex: 1 }}>
        {historyGroups.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 20, textAlign: 'center' }}>
            No disputes analyzed yet
          </div>
        )}
        {historyGroups.map((group, gi) => (
          <div key={gi}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
              margin: '16px 0 8px 0',
            }}>
              {group.category}
            </div>

            {group.items.map((item) => {
              const dispute = item.dispute;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)'
                  }}>
                    {/* Top row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '3px'
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'rgba(255,255,255,0.85)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '120px'
                      }}>
                        {dispute.productName}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        fontWeight: '600',
                        flexShrink: 0,
                        background: 
                          dispute.aiVerdict?.verdict === 'FULL_REFUND' 
                            ? 'rgba(34,197,94,0.15)'
                          : dispute.aiVerdict?.verdict === 'PARTIAL_REFUND'
                            ? 'rgba(245,158,11,0.15)'
                          : dispute.aiVerdict?.verdict === 'DENY'
                            ? 'rgba(239,68,68,0.15)'
                          : 'rgba(249,115,22,0.15)',
                        color:
                          dispute.aiVerdict?.verdict === 'FULL_REFUND'
                            ? '#4ADE80'
                          : dispute.aiVerdict?.verdict === 'PARTIAL_REFUND'
                            ? '#FCD34D'
                          : dispute.aiVerdict?.verdict === 'DENY'
                            ? '#F87171'
                          : '#FB923C'
                      }}>
                        {dispute.aiVerdict?.verdict === 'FULL_REFUND' 
                          ? `₹${dispute.amount} Refund`
                        : dispute.aiVerdict?.verdict === 'PARTIAL_REFUND'
                          ? `₹${dispute.aiVerdict.recommendedAmount} Partial`
                        : dispute.aiVerdict?.verdict === 'DENY'
                          ? 'Denied'
                        : dispute.aiVerdict?.verdict === 'ESCALATE'
                          ? 'Escalated'
                        : 'Pending'}
                      </span>
                    </div>

                    {/* Bottom row */}
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '120px'
                      }}>
                        {dispute.sellerName}
                      </span>
                      <span>
                        {dispute.aiVerdict?.confidence 
                          ? `${dispute.aiVerdict.confidence}% confidence`
                          : 'Analyzing...'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 8 }}>
        <button
          onClick={onClearHistory || (() => {})}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: 'rgba(255,255,255,0.3)',
          }}
        >
          <AlertTriangle size={12} />
          Clear history
        </button>
      </div>
    </aside>
  );
}
