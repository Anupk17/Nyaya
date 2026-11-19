import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, ArrowRight, CheckCircle2, User, AlertCircle, FileCheck } from 'lucide-react';

function useDeadlineCountdown(respondByStr) {
  const [countdown, setCountdown] = useState({ text: '', tier: 'green', hours: 999 });

  useEffect(() => {
    const update = () => {
      if (!respondByStr) {
        setCountdown({ text: 'No deadline set', tier: 'grey', hours: 999 });
        return;
      }
      const now = Date.now();
      const target = new Date(respondByStr).getTime();
      const diffMs = target - now;

      if (diffMs <= 0) {
        setCountdown({ text: 'EXPIRED (Contesting Closed)', tier: 'grey', hours: 0 });
        return;
      }

      const totalHours = diffMs / (1000 * 3600);
      const d = Math.floor(totalHours / 24);
      const h = Math.floor(totalHours % 24);
      const m = Math.floor((diffMs % (1000 * 3600)) / (1000 * 60));

      let timeText = '';
      if (d > 0) timeText = `${d}d ${h}h ${m}m left`;
      else timeText = `${h}h ${m}m left`;

      // Color tiers per spec:
      // green > 72h, amber 24-72h, red < 24h, grey expired
      let tier = 'green';
      if (totalHours < 24) tier = 'red';
      else if (totalHours <= 72) tier = 'amber';

      setCountdown({ text: timeText, tier, hours: totalHours });
    };

    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [respondByStr]);

  return countdown;
}

export default function CaseListItem({ caseData }) {
  const navigate = useNavigate();
  const dispute = caseData;
  const id = dispute.dispute_id || dispute.id;
  const amount = parseFloat(dispute.dispute_amount || dispute.amount || 0);
  const stage = dispute.dispute_type || dispute.stage || 'DISPUTE';
  const reasonCode = dispute.reason_code || '13.1';
  const reasonDesc = dispute.reason_description || dispute.userMessage || 'Payment dispute raised against merchant';
  const customerName = dispute.customer_details?.customer_name || dispute.buyerName || 'Cardholder';
  const customerEmail = dispute.customer_details?.customer_email || 'customer@example.com';
  const status = dispute.dispute_status || dispute.status || 'ACTION_REQUIRED';
  const respondBy = dispute.respond_by || dispute.filedAt;

  const { text: countdownText, tier: deadlineTier, hours } = useDeadlineCountdown(respondBy);

  // Badge styles
  const stageStyles = {
    DISPUTE: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    CHARGEBACK: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
    PRE_ARBITRATION: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
    ARBITRATION: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' }
  }[stage] || { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };

  const deadlineStyles = {
    red: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dot: '#EF4444' },
    amber: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', dot: '#F59E0B' },
    green: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', dot: '#10B981' },
    grey: { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB', dot: '#9CA3AF' }
  }[deadlineTier];

  const handleOpenDispute = () => {
    navigate(`/case/${id}`);
  };

  const isUrgent = deadlineTier === 'red' && status === 'ACTION_REQUIRED';

  return (
    <div
      onClick={handleOpenDispute}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${isUrgent ? '#FCA5A5' : '#E5E7EB'}`,
        borderLeft: `5px solid ${isUrgent ? '#EF4444' : (deadlineTier === 'amber' ? '#F59E0B' : '#10B981')}`,
        borderRadius: 12,
        padding: '18px 20px',
        marginBottom: 14,
        boxShadow: isUrgent ? '0 4px 12px rgba(239, 68, 68, 0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      className="hover:shadow-md hover:border-gray-400"
    >
      {/* Top row: ID, Stage, Reason, Amount, and Deadline Countdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
            {id}
          </span>

          {/* Stage Badge */}
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 6,
            background: stageStyles.bg,
            color: stageStyles.text,
            border: `1px solid ${stageStyles.border}`
          }}>
            {stage}
          </span>

          {/* Reason Code Pill */}
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            background: '#F3F4F6',
            color: '#4B5563'
          }}>
            Code {reasonCode}
          </span>

          {/* Order Ref */}
          {dispute.order_details?.order_id && (
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
              Order: {dispute.order_details.order_id}
            </span>
          )}
        </div>

        {/* Right: Amount & Deadline Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Deadline Countdown (Headline Feature) */}
          <div
            title="Contesting is impossible after deadline passes in Cashfree"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              background: deadlineStyles.bg,
              color: deadlineStyles.text,
              border: `1px solid ${deadlineStyles.border}`
            }}
          >
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: deadlineStyles.dot,
              animation: deadlineTier === 'red' ? 'pulse 1s infinite' : 'none'
            }} />
            <Clock size={12} />
            {countdownText}
          </div>

          {/* Amount */}
          <div style={{ fontSize: 17, fontWeight: 900, color: '#111827', textAlign: 'right' }}>
            ₹{amount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Urgent Warning Banner if < 24h */}
      {isUrgent && (
        <div style={{
          padding: '6px 10px',
          borderRadius: 6,
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#B91C1C',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10
        }}>
          <ShieldAlert size={14} color="#EF4444" />
          RESPONSE REQUIRED IN &lt; 24H: Contesting is disabled by payment network after expiration.
        </div>
      )}

      {/* Middle row: Customer statement & claim */}
      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, marginBottom: 12 }}>
        {reasonDesc}
      </div>

      {/* Bottom row: Customer info, Status, Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#6B7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#374151' }}>
            <User size={13} color="#9CA3AF" />
            {customerName}
          </span>
          <span>{customerEmail}</span>
          {dispute.order_details?.delivery_details?.status && (
            <span style={{
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 4,
              background: dispute.order_details.delivery_details.otp_verified ? '#ECFDF5' : '#F3F4F6',
              color: dispute.order_details.delivery_details.otp_verified ? '#059669' : '#6B7280',
              fontWeight: 600
            }}>
              Delivery: {dispute.order_details.delivery_details.status}
              {dispute.order_details.delivery_details.otp_verified ? ' (OTP Verified)' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            background: status === 'CONTESTED' ? '#ECFDF5' : (status === 'REFUNDED' ? '#FFFBEB' : '#F3F4F6'),
            color: status === 'CONTESTED' ? '#059669' : (status === 'REFUNDED' ? '#D97706' : '#4B5563')
          }}>
            {status}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDispute();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              borderRadius: 6,
              background: '#F97316',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Analyze & Defend
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
