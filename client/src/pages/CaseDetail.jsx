import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Play, AlertTriangle, IndianRupee,
  Calendar, User, Store, MessageSquare, Scale, Loader2, Check, X
} from 'lucide-react';
import { fetchCase, resolveCase, approveCase, rejectCase } from '../lib/api';

// ── sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function MetaField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{value || '—'}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending:   { bg: '#FEF3C7', color: '#92400E' },
    resolved:  { bg: '#D1FAE5', color: '#065F46' },
    escalated: { bg: '#FEE2E2', color: '#991B1B' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: s.bg, color: s.color }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const AGENT_CONFIG = {
  evidence: { name: 'Evidence Agent',    icon: '🔍', borderColor: '#6366F1' },
  merchant: { name: 'Merchant Advocate', icon: '🏪', borderColor: '#6B7280' },
  customer: { name: 'Customer Advocate', icon: '👤', borderColor: '#10B981' },
  judge:    { name: 'Judge Agent',       icon: '⚖️', borderColor: '#7C3AED' },
};

function AgentCard({ agent, content, isLoading }) {
  const cfg = AGENT_CONFIG[agent];
  if (!cfg) return null;
  return (
    <div style={{ borderLeft: `3px solid ${cfg.borderColor}`, background: 'white', border: `1px solid #E5E7EB`, borderRadius: '0 10px 10px 0', padding: '14px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{cfg.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{cfg.name}</span>
        {isLoading && <Loader2 size={13} color="#9CA3AF" style={{ animation: 'spin 0.8s linear infinite' }} />}
      </div>
      {isLoading ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Analyzing case...</p>
      ) : content ? (
        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
          {content.summary && <p style={{ marginBottom: 8 }}>{content.summary}</p>}
          {content.position && <p style={{ marginBottom: 8 }}>{content.position}</p>}
          {content.key_facts?.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {content.key_facts.map((f, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F97316', flexShrink: 0, marginTop: 7 }} />
                  {f}
                </li>
              ))}
            </ul>
          )}
          {content.supporting_points?.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {content.supporting_points.map((p, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F97316', flexShrink: 0, marginTop: 7 }} />
                  {p}
                </li>
              ))}
            </ul>
          )}
          {typeof content === 'string' && <p>{content}</p>}
        </div>
      ) : null}
    </div>
  );
}

import VerdictCard from '../components/VerdictCard';
function StepperBar({ currentStep, isProcessing }) {
  const steps = ['Dispute Filed', 'Evidence Gathered', 'Agents Argue', 'Verdict Issued'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 12 }}>
      {steps.map((label, i) => {
        const done    = i < currentStep;
        const active  = i === currentStep && isProcessing;
        const color   = done || active ? '#F97316' : '#D1D5DB';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#F97316' : active ? '#FFF7ED' : '#F3F4F6', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Check size={14} color="white" /> : active ? <Loader2 size={14} color="#F97316" style={{ animation: 'spin 0.8s linear infinite' }} /> : <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{i + 1}</span>}
              </div>
              <div style={{ fontSize: 11, color: done || active ? '#F97316' : '#9CA3AF', marginTop: 6, fontWeight: done || active ? 600 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#F97316' : '#F3F4F6', margin: '0 8px', marginBottom: 20, borderRadius: 2, transition: 'background 0.4s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [isRunning, setIsRunning]     = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [agentMessages, setAgentMessages] = useState([]);
  const [verdict, setVerdict]         = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadCase(); }, [id]);

  async function loadCase() {
    try {
      setLoading(true);
      const data = await fetchCase(id);
      setCaseData(data);
      if (data.resolutions?.length > 0) {
        const latest = data.resolutions[data.resolutions.length - 1];
        if (latest.verdict) {
          setVerdict(latest.verdict);
          setCurrentStep(4);
          if (latest.agent_outputs) {
            setAgentMessages(latest.agent_outputs.map(ao => ({ agent: ao.agent, content: ao.content, isComplete: true })));
          }
        }
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleRunNyaya() {
    setIsRunning(true);
    setCurrentStep(0);
    setAgentMessages([]);
    setVerdict(null);
    try {
      await resolveCase(id, (event) => {
        switch (event.type) {
          case 'start':       setCurrentStep(0); break;
          case 'agent_start':
            setCurrentStep(event.step);
            setAgentMessages(prev => [...prev.filter(m => !(m.agent === event.agent && m.isLoading)), { agent: event.agent, content: null, isLoading: true }]);
            break;
          case 'agent_complete':
            setCurrentStep(event.step);
            setAgentMessages(prev => prev.map(m => m.agent === event.output.agent && m.isLoading ? { agent: event.output.agent, content: event.output.content, isLoading: false, isComplete: true } : m));
            break;
          case 'complete':
            setVerdict(event.verdict);
            setCurrentStep(4);
            setIsRunning(false);
            loadCase();
            break;
          case 'error':
            setError(event.error);
            setIsRunning(false);
            break;
        }
      });
    } catch (err) { setError(err.message); setIsRunning(false); }
  }

  async function handleApprove() {
    try { setActionLoading(true); const r = await approveCase(id); setVerdict(r.verdict); await loadCase(); }
    catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  }

  async function handleReject() {
    try { setActionLoading(true); const r = await rejectCase(id); setVerdict(r.verdict); await loadCase(); }
    catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  }

  // ── loading/error ──────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #F97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: '#6B7280' }}>Loading case...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'flex-start', paddingTop: 48 }}>
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, textAlign: 'center', maxWidth: 400 }}>
        <AlertTriangle size={32} color="#EF4444" style={{ margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>{error}</p>
        <Link to="/cases" style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', background: '#F97316', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
          Back to Cases
        </Link>
      </div>
    </div>
  );

  if (!caseData) return null;

  const { dispute, transaction } = caseData;
  const isAlreadyResolved = dispute.status === 'resolved' || dispute.status === 'escalated';
  const showApproval = verdict?.action_taken === 'pending_human_approval' && !isAlreadyResolved;

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>

        {/* Back */}
        <Link to="/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF', textDecoration: 'none', marginBottom: 20 }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'}
          onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
        >
          <ArrowLeft size={13} /> Back to Cases
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280' }}>Case Detail</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9CA3AF' }}>{dispute.id}</span>
              {dispute.merchant_dispute_history_count > 2 && (
                <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={11} /> Repeat Offender · {dispute.merchant_dispute_history_count} disputes
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              {transaction.item_description}
            </h1>
          </div>
          {!isAlreadyResolved && !isRunning && !verdict && (
            <button
              onClick={handleRunNyaya}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#F97316', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
            >
              <Scale size={15} /> Run Nyaya
            </button>
          )}
        </div>

        {/* Stepper */}
        {(isRunning || currentStep > 0) && (
          <div style={{ marginBottom: 24 }}>
            <StepperBar currentStep={currentStep} isProcessing={isRunning} />
          </div>
        )}

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Transaction summary */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
              <SectionLabel>Transaction Summary</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                <MetaField label="Amount" value={`₹${transaction.amount?.toLocaleString('en-IN')}`} />
                <MetaField label="Payment" value={transaction.payment_method} />
                <MetaField label="Delivery Status" value={transaction.delivery_status?.replace(/_/g, ' ')} />
                <MetaField label="Confirmation" value={transaction.delivery_confirmation === 'none' ? 'None' : transaction.delivery_confirmation?.replace(/_/g, ' ')} />
              </div>
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <MetaField label="Customer" value={transaction.customer_name} />
                <MetaField label="Merchant" value={transaction.merchant_name} />
              </div>
            </div>

            {/* Claims */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderLeft: '3px solid #10B981', borderRadius: 12, padding: 20 }}>
                <SectionLabel>Customer's Claim</SectionLabel>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>"{dispute.customer_claim}"</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderLeft: '3px solid #6B7280', borderRadius: 12, padding: 20 }}>
                <SectionLabel>Merchant's Claim</SectionLabel>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>"{dispute.merchant_claim}"</p>
              </div>
            </div>

            {/* Agent analysis */}
            {agentMessages.length > 0 && (
              <div>
                <SectionLabel>Agent Analysis</SectionLabel>
                {agentMessages.map((msg, i) => (
                  <AgentCard key={`${msg.agent}-${i}`} agent={msg.agent} content={msg.content} isLoading={msg.isLoading} />
                ))}
              </div>
            )}

            {/* Verdict */}
            {verdict && (
              <div>
                <SectionLabel>Verdict</SectionLabel>
                <VerdictCard verdict={verdict} caseId={dispute.id} agentOutputs={agentMessages} />

              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Case info */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
              <SectionLabel>Case Info</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={14} color="#9CA3AF" />
                  <span style={{ fontSize: 11, color: '#6B7280' }}>Filed:</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                    {new Date(dispute.filed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={14} color="#9CA3AF" />
                  <span style={{ fontSize: 11, color: '#6B7280' }}>Filed by:</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', textTransform: 'capitalize' }}>{dispute.filed_by}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>Status:</span>
                  <StatusPill status={dispute.status} />
                </div>
              </div>
            </div>

            {/* Chat log */}
            {dispute.chat_log?.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
                <SectionLabel>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={12} /> Chat History
                  </span>
                </SectionLabel>
                <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dispute.chat_log.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'customer' ? 'flex-start' : 'flex-end' }}>
                      <div style={{
                        maxWidth: '85%',
                        padding: '8px 12px',
                        borderRadius: msg.from === 'customer' ? '0 10px 10px 10px' : '10px 10px 0 10px',
                        background: msg.from === 'customer' ? '#F9FAFB' : '#111827',
                        border: msg.from === 'customer' ? '1px solid #E5E7EB' : 'none',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: msg.from === 'customer' ? '#9CA3AF' : 'rgba(255,255,255,0.5)', marginBottom: 3 }}>
                          {msg.from}
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.6, color: msg.from === 'customer' ? '#374151' : 'white' }}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default CaseDetail;
