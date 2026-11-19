import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Zap, Clock, ShieldCheck, CheckCircle2, AlertTriangle, BarChart2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { fetchAnalytics, fetchAuditLog } from '../lib/api';

export default function Impact() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [s, logs] = await Promise.all([fetchAnalytics(), fetchAuditLog()]);
      setStats(s);
      setAuditLogs(logs || []);
      setLoading(false);
    } catch (e) {
      console.error('Analytics load error:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 }}>
        <RefreshCw size={28} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (!stats || stats.total_disputes === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32 }}>
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 40, textAlign: 'center', maxWidth: 420 }}>
          <BarChart2 size={48} color="#F97316" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>No disputes logged yet</h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 1.5 }}>
            Analyze a Cashfree dispute in the Queue to compute live resolution metrics.
          </p>
          <button 
            onClick={() => navigate('/cases')}
            style={{ padding: '10px 20px', background: '#F97316', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Go to Dispute Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F9FAFB' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* Title */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>
              Resolution Analytics
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Live computed metrics from Cashfree PG disputes and human-in-the-loop audit logs. Projections labeled as estimates.
            </p>
          </div>
          <button
            onClick={loadAnalytics}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Section 8 Required KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard
            icon={Target}
            label="Disputes Handled"
            value={stats.total_disputes}
            subtext="Tracked Cashfree disputes"
            accent="total"
          />
          <StatCard
            icon={AlertTriangle}
            label="Amount at Risk"
            value={`₹${stats.amount_at_risk.toLocaleString('en-IN')}`}
            subtext="Total dispute value"
            accent="escalated"
          />
          <StatCard
            icon={ShieldCheck}
            label="Amount Recovered"
            value={`₹${stats.amount_recovered.toLocaleString('en-IN')}`}
            subtext="Approved CONTEST/REFUND"
            accent="resolved"
          />
          <StatCard
            icon={TrendingUp}
            label="Average Confidence"
            value={`${stats.average_confidence}%`}
            subtext="AI verdict calibration"
            accent="pending"
          />
          <StatCard
            icon={CheckCircle2}
            label="Human Override Rate"
            value={`${stats.human_override_rate}%`}
            subtext="Ops judgment adjustments"
            accent="total"
          />
          <StatCard
            icon={Clock}
            label="Average Action Time"
            value="3.4s"
            subtext="AI deliberation (estimate)"
            accent="pending"
          />
        </div>

        {/* Audit Trail & Action Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Stage Distribution */}
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>
              Dispute Stages Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(stats.stage_breakdown || {}).map(([stage, count]) => {
                const pct = stats.total_disputes > 0 ? Math.round((count / stats.total_disputes) * 100) : 0;
                return (
                  <div key={stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: '#374151' }}>{stage}</span>
                      <span style={{ color: '#6B7280' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: stage === 'CHARGEBACK' ? '#F97316' : (stage === 'DISPUTE' ? '#3B82F6' : '#8B5CF6')
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real Actions Executed on Cashfree */}
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>
              Human Ops Executions via Cashfree
            </h3>
            {auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontSize: 12 }}>
                No actions executed yet. Review disputes in queue and click Approve to trigger Cashfree API calls.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {auditLogs.slice(0, 5).map(log => (
                  <div key={log.id} style={{ padding: '8px 12px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span style={{ color: '#111827' }}>{log.dispute_id} · {log.action}</span>
                      <span style={{ color: '#059669' }}>₹{log.amount}</span>
                    </div>
                    <div style={{ color: '#6B7280', marginTop: 2 }}>
                      Approved by {log.approved_by} at {new Date(log.timestamp).toLocaleTimeString()}
                      {log.is_override ? ` (Override: ${log.override_reason})` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
