import React, { useState, useEffect } from 'react';
import { FileText, Clock, AlertTriangle, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import CaseListItem from '../components/CaseListItem';
import StatCard from '../components/StatCard';
import { fetchDisputes, fetchMode } from '../lib/api';
import { motion } from 'motion/react';

export function Dashboard() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStage, setFilterStage] = useState('ALL');
  const [modeInfo, setModeInfo] = useState({ mode: 'mock' });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, mode] = await Promise.all([fetchDisputes(), fetchMode()]);
      setModeInfo(mode);

      // Sort by nearest deadline (ascending) per Section 6 instructions
      const sorted = (list || []).sort((a, b) => {
        const timeA = a.respond_by ? new Date(a.respond_by).getTime() : 9999999999999;
        const timeB = b.respond_by ? new Date(b.respond_by).getTime() : 9999999999999;
        return timeA - timeB;
      });

      setDisputes(sorted);
      setLoading(false);
    } catch (e) {
      console.error('Error loading disputes:', e);
      setError(e.message || 'Failed to load disputes from Cashfree adapter');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAmountAtRisk = disputes.reduce((sum, d) => sum + (parseFloat(d.dispute_amount) || 0), 0);
  const pendingCount = disputes.filter(d => (d.dispute_status || d.status) === 'ACTION_REQUIRED').length;
  const chargebackCount = disputes.filter(d => (d.dispute_type || d.stage) === 'CHARGEBACK').length;
  const urgentCount = disputes.filter(d => {
    if (!d.respond_by) return false;
    const hours = (new Date(d.respond_by).getTime() - Date.now()) / (1000 * 3600);
    return hours > 0 && hours < 24;
  }).length;

  const filteredDisputes = disputes.filter(d => {
    if (filterStage === 'ALL') return true;
    return (d.dispute_type || d.stage) === filterStage;
  });

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F9FAFB' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* Top Header Row */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>
                Dispute Cases Queue
              </h1>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 20,
                background: modeInfo.mode === 'sandbox' ? '#ECFDF5' : '#FFFBEB',
                color: modeInfo.mode === 'sandbox' ? '#059669' : '#D97706',
                border: `1px solid ${modeInfo.mode === 'sandbox' ? '#A7F3D0' : '#FDE68A'}`
              }}>
                {modeInfo.mode === 'sandbox' ? 'CASHFREE SANDBOX' : 'MOCK MODE'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }}>
              Cashfree merchant chargebacks sorted by response deadline. Red countdown indicates deadline &lt; 24h.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh Feed
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon={FileText} label="Total Disputes" value={disputes.length} subtext="Active Cashfree cases" accent="total" />
          <StatCard icon={Clock} label="Action Required" value={pendingCount} subtext="Awaiting defense decision" accent="pending" />
          <StatCard icon={AlertTriangle} label="< 24h Deadlines" value={urgentCount} subtext="Critical priority alert" accent="escalated" />
          <StatCard icon={ShieldCheck} label="Amount at Risk" value={`₹${totalAmountAtRisk.toLocaleString('en-IN')}`} subtext="Total contested exposure" accent="resolved" />
        </div>

        {/* Stage Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, borderBottom: '1px solid #E5E7EB', paddingBottom: 10 }}>
          {['ALL', 'CHARGEBACK', 'DISPUTE', 'PRE_ARBITRATION'].map(stage => (
            <button
              key={stage}
              onClick={() => setFilterStage(stage)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: filterStage === stage ? '#111827' : '#FFFFFF',
                color: filterStage === stage ? '#FFFFFF' : '#4B5563',
                cursor: 'pointer',
                boxShadow: filterStage === stage ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {stage === 'ALL' ? 'All Stages' : stage}
              {stage !== 'ALL' && ` (${disputes.filter(d => (d.dispute_type || d.stage) === stage).length})`}
            </button>
          ))}
        </div>

        {/* Dispute List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#F97316' }} />
            <p style={{ fontSize: 13, fontWeight: 600 }}>Connecting to Cashfree adapter...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 24, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>Error loading disputes</div>
            <div style={{ fontSize: 13 }}>{error}</div>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No disputes found for filter {filterStage}</p>
          </div>
        ) : (
          filteredDisputes.map(d => (
            <CaseListItem key={d.dispute_id || d.id} caseData={d} />
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
