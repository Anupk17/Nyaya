import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisputeStore } from '../store/disputeStore';
import { Check, X, ArrowRight, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

function useEscrowTimer(filedAt) {
  const [timeLeft, setTimeLeft] = useState('')
  const [urgency, setUrgency] = useState('safe')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const hoursElapsed = (
        now.getTime() - new Date(filedAt).getTime()
      ) / 1000 / 3600
      
      const hoursLeft = Math.max(0, 48 - hoursElapsed)
      const h = Math.floor(hoursLeft)
      const m = Math.floor((hoursLeft - h) * 60)

      if (hoursLeft <= 0) {
        setTimeLeft('Escrow closed')
        setUrgency('closed')
      } else if (hoursLeft < 6) {
        setTimeLeft(`${h}h ${m}m left`)
        setUrgency('critical')
      } else if (hoursLeft < 24) {
        setTimeLeft(`${h}h ${m}m left`)
        setUrgency('warning')
      } else {
        setTimeLeft(`${h}h ${m}m left`)
        setUrgency('safe')
      }
    }

    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [filedAt])

  return { timeLeft, urgency }
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export default function CaseListItem({ caseData }) {
  const navigate = useNavigate();
  const { approveDispute, overrideDispute, escalateDispute } = useDisputeStore();
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const { timeLeft, urgency } = useEscrowTimer(caseData.filedAt);

  const colors = {
    safe:     { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
    warning:  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
    critical: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
    closed:   { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' }
  };

  const handleApprove = (e) => {
    e.stopPropagation();
    approveDispute(caseData.id);
    alert(`Case ${caseData.id} approved.\nPaytm processing team notified.`);
  };

  const handleOverrideClick = (e) => {
    e.stopPropagation();
    setIsOverriding(true);
  };

  const submitOverride = (e) => {
    e.stopPropagation();
    if (!overrideReason.trim()) return;
    overrideDispute(caseData.id, overrideReason);
    setIsOverriding(false);
  };

  const handleAssignToSenior = (e) => {
    e.stopPropagation();
    alert(`Case ${caseData.id} assigned to Senior Reviewer.`);
  };

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '20px',
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top Row: ID, Product, Amount, Date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'monospace', fontWeight: 600 }}>{caseData.id}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{caseData.productName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>₹{caseData.amount?.toLocaleString('en-IN')}</span>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{formatDate(caseData.filedAt)}</span>
          <div style={{
            background: colors[urgency].bg,
            color: colors[urgency].text,
            padding: '3px 8px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{
              width: '5px', height: '5px',
              borderRadius: '50%',
              background: colors[urgency].dot
            }} />
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Buyer & Seller */}
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
        Buyer: <strong style={{ color: '#374151' }}>{caseData.buyerName}</strong> • Seller: <strong style={{ color: '#374151' }}>{caseData.sellerName}</strong>
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: 16, padding: '16px 20px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
        <div style={{ position: 'relative' }}>
          {/* Vertical Line */}
          <div style={{ position: 'absolute', top: 12, bottom: 12, left: 9, width: 2, background: '#E5E7EB' }} />
          
          {/* Step 1 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, marginBottom: 12, color: '#374151' }}>
            <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: '#10B981', color: 'white', flexShrink: 0 }}>
              <Check size={12} strokeWidth={3} />
            </div>
            <div>
              <span style={{ color: '#6B7280', marginRight: 8 }}>{formatDate(caseData.filedAt)} {formatTime(caseData.filedAt)}</span>
              Dispute filed
            </div>
          </div>
          
          {/* Step 2 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, marginBottom: caseData.aiVerdict ? 12 : 0, color: '#374151' }}>
            {caseData.aiVerdict ? (
               <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: '#10B981', color: 'white', flexShrink: 0 }}>
                 <Check size={12} strokeWidth={3} />
               </div>
            ) : (
               <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', border: '2px solid #E5E7EB', background: 'white', flexShrink: 0 }}>
                 <Loader2 size={12} className="animate-spin" color="#6B7280" />
               </div>
            )}
            <div>
              <span style={{ color: '#6B7280', marginRight: 8 }}>{formatDate(caseData.filedAt)} {formatTime(new Date(new Date(caseData.filedAt).getTime() + 60000))}</span>
              AI analysis {caseData.aiVerdict ? 'started' : 'in progress...'}
            </div>
          </div>

          {/* Step 3 */}
          {caseData.aiVerdict && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, marginBottom: 12, color: '#374151' }}>
              <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: '#10B981', color: 'white', flexShrink: 0 }}>
                <Check size={12} strokeWidth={3} />
              </div>
              <div>
                <span style={{ color: '#6B7280', marginRight: 8 }}>{formatDate(caseData.filedAt)} {formatTime(new Date(new Date(caseData.filedAt).getTime() + 120000))}</span>
                4-agent verdict: <strong>{caseData.aiVerdict.verdict.replace(/_/g, ' ')}</strong> {caseData.aiVerdict.recommendedAmount > 0 ? `₹${caseData.aiVerdict.recommendedAmount}` : ''}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {caseData.aiVerdict && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#374151' }}>
              {caseData.status === 'PENDING' ? (
                <>
                  <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: '#F8FAFC', border: '1px solid #E5E7EB', fontSize: 11, flexShrink: 0 }}>
                    ⏳
                  </div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>Awaiting reviewer approval</div>
                </>
              ) : (
                <>
                  <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: '#10B981', color: 'white', flexShrink: 0 }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div>
                    <span style={{ color: '#6B7280', marginRight: 8 }}>
                      {formatDate(caseData.reviewerAction?.timestamp || new Date())} {formatTime(caseData.reviewerAction?.timestamp || new Date())}
                    </span>
                    {caseData.status === 'APPROVED' ? 'Approved by Reviewer' : `Overridden: ${caseData.reviewerAction?.reason}`}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        
        {/* Status specific UI */}
        {caseData.status === 'APPROVED' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 13, fontWeight: 600, background: '#D1FAE5', padding: '6px 12px', borderRadius: 6 }}>
            <CheckCircle2 size={16} /> ✓ Approved by Reviewer
          </div>
        )}

        {caseData.status === 'OVERRIDDEN' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D97706', fontSize: 13, fontWeight: 600, background: '#FEF3C7', padding: '6px 12px', borderRadius: 6 }}>
            ⚠ Overridden by Reviewer: {caseData.reviewerAction?.reason}
          </div>
        )}

        {caseData.status === 'ESCALATED' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626', fontSize: 13, fontWeight: 600, background: '#FEE2E2', padding: '6px 12px', borderRadius: 6 }}>
              <AlertTriangle size={16} /> ⚠ Escalated — Senior Review Required
            </div>
            <button 
              onClick={handleAssignToSenior}
              style={{ padding: '6px 12px', background: 'white', border: '1px solid #DC2626', color: '#DC2626', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Assign to Senior Reviewer
            </button>
          </>
        )}

        {caseData.status === 'PENDING' && caseData.aiVerdict && (
          <>
            <button 
              onClick={handleApprove}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: '#10B981', border: 'none', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Check size={16} /> Approve
            </button>
            <button 
              onClick={handleOverrideClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: 'white', border: '1px solid #E5E7EB', color: '#374151', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <X size={16} /> Override
            </button>
          </>
        )}

        <button 
          onClick={() => navigate(`/case/${caseData.id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: 'transparent', border: 'none', color: '#6B7280', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}
        >
          View Details <ArrowRight size={16} />
        </button>
      </div>

      {/* Override Input Area */}
      {isOverriding && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Enter reason for override:</span>
          <input 
            type="text" 
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            style={{ flex: 1, padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13 }}
            placeholder="e.g. Customer provided additional evidence via email"
            autoFocus
          />
          <button 
            onClick={submitOverride}
            style={{ padding: '6px 16px', background: '#F97316', border: 'none', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Submit Override
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOverriding(false); }}
            style={{ padding: '6px 16px', background: 'white', border: '1px solid #E5E7EB', color: '#6B7280', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
