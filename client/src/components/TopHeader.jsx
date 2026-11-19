import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { GooeyInput } from '@/components/ui/gooey-input';
import { runMonitoringChecks } from '../lib/proactiveMonitor';
import { fetchMode, fetchDisputes } from '../lib/api';

export default function TopHeader({ isHistoryOpen, setIsHistoryOpen }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [modeInfo, setModeInfo] = useState({ mode: 'mock', hasCredentials: false });

  // Fetch running mode from backend
  useEffect(() => {
    fetchMode().then(info => {
      if (info) setModeInfo(info);
    });
  }, []);

  // Proactive 60s monitor
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const disputes = await fetchDisputes();
        const newAlerts = runMonitoringChecks(disputes || []);
        setAlerts(newAlerts);
        setNewAlertCount(newAlerts.filter(a => !a.dismissed).length);
      } catch (e) {
        console.warn('Could not run proactive checks:', e.message);
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = (id) => {
    const updated = alerts.map(a => a.id === id ? { ...a, dismissed: true } : a);
    setAlerts(updated);
    setNewAlertCount(updated.filter(a => !a.dismissed).length);
  };

  const navigateToCase = (caseId) => {
    navigate(`/case/${caseId}`);
  };

  const isSandbox = modeInfo.mode === 'sandbox';

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.8; }
          }
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}
      </style>
      <header style={{
        height: 60,
        borderBottom: '1px solid #E5E7EB',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        {/* Left — title + tagline + Cashfree status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
                ⚖️ Nyaya
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>
                AI Chargeback-Defense Teammate
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#F97316', fontWeight: 600, marginTop: 1 }}>
              “Chargebacks defended. Not just tracked.”
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* CASHFREE MODE BADGE */}
            <div
              title={isSandbox ? "Connected to Cashfree Sandbox PG" : "Running in Mock Mode with seeded disputes"}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: isSandbox ? '#ECFDF5' : '#FFFBEB',
                color: isSandbox ? '#059669' : '#D97706',
                border: `1px solid ${isSandbox ? '#A7F3D0' : '#FDE68A'}`
              }}
            >
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isSandbox ? '#10B981' : '#F59E0B',
                animation: 'pulse 2s infinite'
              }} />
              {isSandbox ? 'SANDBOX' : 'MOCK DATA'}
            </div>

            {/* Cashfree Integration Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: '#F3F4F6',
              color: '#374151',
              border: '1px solid #E5E7EB'
            }}>
              <Zap size={12} color="#F97316" />
              Cashfree PG
            </div>

            {/* Sarvam AI Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: '#F3F4F6',
              color: '#374151',
              border: '1px solid #E5E7EB'
            }}>
              🇮🇳 Sarvam Voice & Indic
            </div>
          </div>
        </div>

        {/* Right — search + bell + ops reviewer profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Quick search */}
          <div style={{ position: 'relative' }}>
            <GooeyInput
              placeholder="Search by dispute ID, order ID, or customer..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate('/cases');
                }
              }}
              collapsedWidth={130}
              expandedWidth={280}
              classNames={{
                input: "text-[#374151] text-xs",
                buttonRow: "bg-white text-[#374151]",
                bubbleSurface: "bg-[#F97316]"
              }}
            />
          </div>

          {/* Alert Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAlertPanel(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              title="Proactive Dispute Alerts"
            >
              <Bell size={18} color={newAlertCount > 0 ? '#F97316' : '#6B7280'} />
              {newAlertCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {newAlertCount}
                </span>
              )}
            </button>
          </div>

          {/* Ops Reviewer profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            background: '#F9FAFB',
            borderRadius: 8,
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#111827',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              OP
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: 1.1 }}>
                Ops Reviewer
              </div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>
                Human Approver
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-in Alert Drawer */}
      {showAlertPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 380,
          height: '100vh',
          background: 'white',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.25s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#F97316" />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                Proactive Defense Monitor
              </span>
              {newAlertCount > 0 && (
                <span style={{
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: 12,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  {newAlertCount} urgent
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAlertPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 20,
                color: '#9CA3AF',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* Alert List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>
                <ShieldCheck size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
                No active threats or expiring deadlines.
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                  All Cashfree disputes within safe response windows.
                </div>
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    background: alert.dismissed ? '#F9FAFB' : '#FFFFFF',
                    border: `1px solid ${alert.severity === 'CRITICAL' ? '#FCA5A5' : '#FED7AA'}`,
                    borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? '#EF4444' : '#F97316'}`,
                    borderRadius: 8,
                    padding: 14,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>
                      {alert.type === 'DEADLINE_URGENT' && '⏱️ '}
                      {alert.type === 'STAGE_ESCALATED' && '⚡ '}
                      {alert.type === 'HIGH_VALUE' && '💰 '}
                      {alert.type === 'AGENT_CONFLICT' && '⚖️ '}
                      {alert.type === 'REPEAT_CUSTOMER' && '👤 '}
                      {alert.title}
                    </div>
                    <span style={{
                      fontSize: 10,
                      background: alert.severity === 'CRITICAL' ? '#EF4444' : '#F97316',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 700
                    }}>
                      {alert.severity}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5, marginBottom: 8 }}>
                    {alert.message}
                  </div>

                  <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginBottom: 10 }}>
                    Required: {alert.actionRequired}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setShowAlertPanel(false);
                        navigateToCase(alert.caseId);
                      }}
                      style={{
                        background: '#F97316',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Defend Dispute →
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      style={{
                        background: '#FFFFFF',
                        color: '#6B7280',
                        border: '1px solid #D1D5DB',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 11,
                        cursor: 'pointer'
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #E5E7EB',
            fontSize: 11,
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#10B981',
              animation: 'pulse 2s infinite'
            }} />
            Cashfree PG monitor active · Real-time 60s cadence
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showAlertPanel && (
        <div
          onClick={() => setShowAlertPanel(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 999
          }}
        />
      )}
    </>
  );
}
