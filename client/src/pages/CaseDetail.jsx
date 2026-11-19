import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Play, AlertTriangle, ShieldCheck,
  Calendar, User, Package, Clock, Scale, Loader2, CheckCircle2, FileText, Zap
} from 'lucide-react';
import { fetchDispute, analyzeDispute } from '../lib/api';
import VerdictCard from '../components/VerdictCard';

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function MetaField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value || '—'}</div>
    </div>
  );
}

const AGENT_CONFIG = {
  evidence: { name: 'Evidence Agent',            icon: '🔍', borderColor: '#3B82F6' },
  merchant: { name: 'Merchant Advocate',         icon: '🏪', borderColor: '#F97316' },
  customer: { name: 'Cardholder & Issuer Agent', icon: '👤', borderColor: '#10B981' },
  judge:    { name: 'Judge Agent',               icon: '⚖️', borderColor: '#8B5CF6' },
};

function AgentCard({ agent, content, isLoading }) {
  const cfg = AGENT_CONFIG[agent];
  if (!cfg) return null;
  return (
    <div style={{
      borderLeft: `4px solid ${cfg.borderColor}`,
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{cfg.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{cfg.name}</span>
        {isLoading && <Loader2 size={13} color="#F97316" className="animate-spin" />}
      </div>
      {isLoading ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>
          Analyzing Cashfree dispute evidence & policy rules...
        </p>
      ) : content ? (
        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
          {content.summary && <p style={{ margin: '0 0 6px 0' }}>{content.summary}</p>}
          {content.argument_summary && <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>{content.argument_summary}</p>}
          {content.covered?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>COVERED EVIDENCE: </span>
              <span style={{ fontSize: 12 }}>{content.covered.join(', ')}</span>
            </div>
          )}
          {content.missing?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>MISSING EVIDENCE: </span>
              <span style={{ fontSize: 12 }}>{content.missing.join(', ')}</span>
            </div>
          )}
          {content.key_defenses?.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {content.key_defenses.map((f, i) => (
                <li key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <span style={{ color: '#F97316', fontWeight: 700 }}>•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          {content.cardholder_arguments?.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {content.cardholder_arguments.map((f, i) => (
                <li key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StepperBar({ currentStep, isProcessing }) {
  const steps = ['Dispute Ingested', 'Evidence Checked', 'Advocate Debate', 'Binding Verdict'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, gap: 12 }}>
      {steps.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep && isProcessing;
        const color = done || active ? '#F97316' : '#D1D5DB';
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: done ? '#F97316' : (active ? '#FFF7ED' : '#F3F4F6'),
              border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: done ? 'white' : color, flexShrink: 0
            }}>
              {done ? '✓' : (i + 1)}
            </div>
            <span style={{ fontSize: 12, fontWeight: active || done ? 700 : 500, color: active || done ? '#111827' : '#9CA3AF' }}>
              {label}
            </span>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? '#F97316' : '#E5E7EB' }} />}
          </div>
        );
      })}
    </div>
  );
}

export function CaseDetail() {
  const { id } = useParams();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [agentMessages, setAgentMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const loadCase = async () => {
    setLoading(true);
    try {
      const data = await fetchDispute(id);
      const disp = data.dispute || data;
      setDispute(disp);
      if (data.verdict) setVerdict(data.verdict);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load dispute');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [id]);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setAgentMessages([]);
    try {
      await analyzeDispute(id, (event) => {
        if (event.type === 'agent_start') {
          setCurrentStep(event.step);
          setAgentMessages(prev => [
            ...prev.filter(m => !(m.agent === event.agent && m.isLoading)),
            { agent: event.agent, content: null, isLoading: true }
          ]);
        } else if (event.type === 'agent_complete') {
          setCurrentStep(event.step);
          setAgentMessages(prev => prev.map(m => m.agent === event.output.agent ? { agent: event.output.agent, content: event.output.content, isLoading: false } : m));
        } else if (event.type === 'complete') {
          setVerdict(event.verdict);
          setCurrentStep(4);
          setIsRunning(false);
        } else if (event.type === 'error') {
          setError(event.error);
          setIsRunning(false);
        }
      });
    } catch (err) {
      setError(err.message || 'Pipeline analysis failed');
      setIsRunning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <AlertTriangle size={36} color="#EF4444" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991B1B' }}>{error || 'Dispute not found'}</h3>
        <Link to="/cases" style={{ display: 'inline-block', marginTop: 14, color: '#F97316', fontWeight: 600 }}>
          ← Back to Dispute Queue
        </Link>
      </div>
    );
  }

  const order = dispute.order_details;
  const delivery = order?.delivery_details;
  const customer = dispute.customer_details;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F9FAFB' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>

        {/* Back Link */}
        <Link to="/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', textDecoration: 'none', marginBottom: 16, fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Dispute Queue
        </Link>

        {/* Case Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>
                {dispute.dispute_id}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 6,
                background: dispute.dispute_type === 'CHARGEBACK' ? '#FFF7ED' : '#EFF6FF',
                color: dispute.dispute_type === 'CHARGEBACK' ? '#C2410C' : '#1D4ED8',
                border: '1px solid #FED7AA'
              }}>
                {dispute.dispute_type || dispute.stage}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                Reason Code {dispute.reason_code}
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
              {dispute.reason_description}
            </div>
          </div>

          {/* Trigger 4-Agent Defense Button */}
          {!isRunning && (
            <button
              onClick={handleRunPipeline}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                background: '#F97316',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)'
              }}
            >
              <Scale size={16} />
              {verdict ? 'Re-Run 4-Agent Defense' : 'Run 4-Agent Defense'}
            </button>
          )}
        </div>

        {/* Stepper Progress */}
        {(isRunning || currentStep > 0) && (
          <div style={{ marginBottom: 20 }}>
            <StepperBar currentStep={currentStep} isProcessing={isRunning} />
          </div>
        )}

        {/* Verdict Card (when complete) */}
        {verdict && (
          <div style={{ marginBottom: 24 }}>
            <VerdictCard
              verdict={verdict}
              dispute={dispute}
              disputeId={dispute.dispute_id}
              agentOutputs={agentMessages}
              onActionCompleted={() => loadCase()}
            />
          </div>
        )}

        {/* 2-Column Dossier Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

          {/* Left Column: Order, Evidence, Agents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Order & Delivery Details */}
            <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <SectionLabel>Cashfree Order & Fulfillment Dossier</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
                <MetaField label="Dispute Amount" value={`₹${parseFloat(dispute.dispute_amount).toLocaleString('en-IN')}`} />
                <MetaField label="Order ID" value={order?.order_id} />
                <MetaField label="Courier Partner" value={delivery?.courier} />
                <MetaField label="Tracking No." value={delivery?.tracking_number} />
              </div>
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <MetaField label="Delivery Status" value={delivery?.status} />
                <MetaField
                  label="OTP Verification"
                  value={delivery?.otp_verified ? `Verified (${delivery?.otp_timestamp ? new Date(delivery.otp_timestamp).toLocaleTimeString() : 'Logged'})` : 'No OTP Confirmed'}
                />
              </div>
            </div>

            {/* Cardholder Claim vs Merchant Defense */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E5E7EB', borderLeft: '4px solid #EF4444' }}>
                <SectionLabel>Cardholder's Claim</SectionLabel>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  "{customer?.customer_claim || dispute.reason_description}"
                </div>
              </div>
              <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E5E7EB', borderLeft: '4px solid #10B981' }}>
                <SectionLabel>Merchant Logistics Record</SectionLabel>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  Dispatched to {delivery?.delivery_address || 'Customer shipping address'}. Courier status: {delivery?.status}.
                </div>
              </div>
            </div>

            {/* Agent Deliberation Messages */}
            {agentMessages.length > 0 && (
              <div>
                <SectionLabel>4-Agent Deliberation (Groq Inference Engine)</SectionLabel>
                {agentMessages.map((msg, idx) => (
                  <AgentCard key={`${msg.agent}-${idx}`} agent={msg.agent} content={msg.content} isLoading={msg.isLoading} />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Customer Details & Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Customer Summary Card */}
            <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <SectionLabel>Cardholder Profile</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <MetaField label="Name" value={customer?.customer_name} />
                <MetaField label="Email" value={customer?.customer_email} />
                <MetaField label="Phone" value={customer?.customer_phone} />
                <MetaField label="Repeat Claimant" value={customer?.is_repeat_customer ? 'Yes (History in Cognee)' : 'First Time'} />
              </div>
            </div>

            {/* Response Deadline Card */}
            <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <SectionLabel>Cashfree Deadlines</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <MetaField label="Dispute Filed" value={new Date(dispute.created_at).toLocaleString('en-IN')} />
                <MetaField label="Respond By (Hard Deadline)" value={new Date(dispute.respond_by).toLocaleString('en-IN')} />
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  fontSize: 11,
                  lineHeight: 1.4,
                  fontWeight: 600
                }}>
                  Contesting is impossible after deadline. Nyaya alerts ops when deadline &lt; 24h.
                </div>
              </div>
            </div>

            {/* Uploaded Evidence Pack */}
            <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <SectionLabel>Dispute Documents ({dispute.dispute_evidence?.length || 0})</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(dispute.dispute_evidence || []).map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 8px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                    <FileText size={14} color="#6B7280" />
                    <span style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.doc_type || doc.file_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default CaseDetail;
