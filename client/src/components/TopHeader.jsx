import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { GooeyInput } from '@/components/ui/gooey-input';
import { runMonitoringChecks } from '../lib/proactiveMonitor';
import { PLATFORM_CONFIGS } from '../config/platformConfig';
import { useDisputeStore } from '../store/disputeStore';
export default function TopHeader({ isHistoryOpen, setIsHistoryOpen, useBedrock, setUseBedrock }) {
  const navigate = useNavigate();
  const { disputes, activePlatform, setActivePlatform } = useDisputeStore();
  const [alerts, setAlerts] = useState([]);
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  useEffect(() => {
    // Run immediately on load
    const checkAlerts = () => {
      const newAlerts = runMonitoringChecks(disputes);
      setAlerts(newAlerts);
      setNewAlertCount(newAlerts.filter(a => !a.dismissed).length);
    };
    
    checkAlerts();
    
    // Then run every 60 seconds
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [disputes]);

  const dismissAlert = (id) => {
    const updated = alerts.map(a => a.id === id ? { ...a, dismissed: true } : a);
    setAlerts(updated);
    setNewAlertCount(updated.filter(a => !a.dismissed).length);
  };

  const navigateToCase = (caseId) => {
    navigate(`/case/${caseId}`);
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
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
        background: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        {/* Left — title + subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>
              AI Dispute Assistant
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              Resolve disputes with evidence-based AI arbitration
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {/* Platform Selector */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
              <select
                value={activePlatform}
                onChange={(e) => setActivePlatform(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 500,
                  background: '#FFFFFF',
                  color: '#111827',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  cursor: 'pointer'
                }}
              >
                {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name} Platform
                  </option>
                ))}
              </select>
            </div>

            {/* LLM Status (Removed AWS Bedrock) */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 500,
                  background: '#FFFFFF',
                  color: '#111827',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                🔴 Groq Ultra-Fast (Active)
              </div>
            </div>
          </div>
        </div>

        {/* Right — search + bell + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <GooeyInput
              placeholder="Search disputes..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  alert(`Search results for "${e.target.value}" will appear in the Dispute Queue.`);
                }
              }}
              collapsedWidth={115}
              expandedWidth={200}
              classNames={{
                input: "text-[#374151]",
                buttonRow: "bg-white text-[#374151]",
                bubbleSurface: "bg-[#F97316]"
              }}
            />
          </div>

          {/* Alert Bell */}
          <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white' }}
            onClick={() => setShowAlertPanel(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" 
              fill="none" stroke="#6B7280" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            
            {newAlertCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#EF4444',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s infinite'
              }}>
                {newAlertCount}
              </div>
            )}
          </div>

          {/* Avatar + history toggle */}
          <button
            onClick={() => setIsHistoryOpen?.(!isHistoryOpen)}
            title="Toggle History Panel"
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', border: 'none', flexShrink: 0,
            }}
          >
            N
          </button>
        </div>
      </header>

      {/* ALERT PANEL */}
      {showAlertPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '380px',
          height: '100vh',
          background: 'white',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.2s ease'
        }}>
          
          {/* Panel header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '700',
                color: '#111827'
              }}>
                Nyaya Alerts
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6B7280',
                marginTop: '2px'
              }}>
                {alerts.length} active · Auto-monitored
              </div>
            </div>
            <button onClick={() => setShowAlertPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6B7280'
              }}
            >
              ×
            </button>
          </div>

          {/* Alert list */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '16px'
          }}>
            {alerts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#9CA3AF'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  ✓
                </div>
                <div style={{ fontSize: '14px' }}>
                  All cases on track
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Nyaya is monitoring {disputes.length} disputes
                </div>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} style={{
                  background: alert.severity === 'CRITICAL' ? '#FEF2F2'
                            : alert.severity === 'HIGH' ? '#FFF7ED'
                            : '#FAFAFA',
                  border: `1px solid ${
                    alert.severity === 'CRITICAL' ? '#FECACA'
                  : alert.severity === 'HIGH' ? '#FED7AA'
                  : '#E5E7EB'
                  }`,
                  borderLeft: `3px solid ${
                    alert.severity === 'CRITICAL' ? '#EF4444'
                  : alert.severity === 'HIGH' ? '#F97316'
                  : alert.severity === 'MEDIUM' ? '#F59E0B'
                  : '#6B7280'
                  }`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '6px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {alert.type === 'AGING_CASE' && '⏱ '}
                      {alert.type === 'FRAUD_PATTERN' && '🚨 '}
                      {alert.type === 'HIGH_VALUE' && '💰 '}
                      {alert.type === 'AGENT_CONFLICT' && '⚖️ '}
                      {alert.title}
                    </div>
                    <span style={{
                      fontSize: '10px',
                      background: alert.severity === 'CRITICAL' 
                        ? '#EF4444' : '#F97316',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '600',
                      flexShrink: 0,
                      marginLeft: '8px'
                    }}>
                      {alert.severity}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: '#374151',
                    lineHeight: '1.5',
                    marginBottom: '8px'
                  }}>
                    {alert.message}
                  </div>

                  <div style={{
                    fontSize: '11px',
                    color: '#6B7280',
                    fontStyle: 'italic'
                  }}>
                    Action: {alert.actionRequired}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '10px'
                  }}>
                    <button
                      onClick={() => {
                        setShowAlertPanel(false);
                        navigateToCase(alert.caseId);
                      }}
                      style={{
                        background: '#F97316',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      View Case →
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      style={{
                        background: 'white',
                        color: '#6B7280',
                        border: '1px solid #E5E7EB',
                        borderRadius: '5px',
                        padding: '5px 10px',
                        fontSize: '11px',
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
            padding: '12px 24px',
            borderTop: '1px solid #F3F4F6',
            fontSize: '11px',
            color: '#9CA3AF',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22C55E',
              animation: 'pulse 2s infinite'
            }} />
            Nyaya monitoring active · Checks every 60s
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
            background: 'rgba(0,0,0,0.2)',
            zIndex: 999
          }}
        />
      )}
    </>
  );
}
