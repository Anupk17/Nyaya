import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, FileText, BarChart2, Scale } from 'lucide-react';
import { checkBackendHealth } from '../lib/healthCheck';
import { checkMemoryHealth } from '../lib/cogneeMemory';

const NAV = [
  { name: 'AI Dispute Assistant',    path: '/',       icon: MessageSquare },
  { name: 'Dispute Cases Queue',     path: '/cases',  icon: FileText      },
  { name: 'Resolution Analytics',    path: '/impact', icon: BarChart2     },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const [health, setHealth] = useState({ status: 'healthy', message: 'Checking...' });
  const [memoryOnline, setMemoryOnline] = useState(false);

  useEffect(() => {
    async function fetchHealth() {
      const h = await checkBackendHealth();
      setHealth(h);
    }
    fetchHealth();
    
    checkMemoryHealth().then(setMemoryOnline);
    
    const interval = setInterval(() => {
      fetchHealth();
      checkMemoryHealth().then(setMemoryOnline);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const active = (path) => {
    if (path === '/')       return pathname === '/' || pathname === '/chat' || pathname === '/live-dispute';
    if (path === '/cases')  return pathname === '/cases' || pathname.startsWith('/case/');
    return pathname === path;
  };

  const statusColor = {
    healthy: '#4ADE80',
    degraded: '#FBBF24',
    offline: '#F87171'
  }[health.status] || '#9CA3AF';

  return (
    <aside style={{
      width: 240,
      background: '#1C1C1E',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: '20px 16px',
      flexShrink: 0,
      userSelect: 'none',
    }}>

      {/* Logo */}
      <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Scale size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2 }}>Nyaya</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginTop: 1 }}>
              AI DISPUTE TEAMMATE
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ name, path, icon: Icon }) => {
          const isActive = active(path);
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#F97316' : 'rgba(255,255,255,0.6)',
                background: isActive ? 'rgba(249,115,22,0.15)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}
            >
              <Icon size={17} />
              {name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #3A3A3C',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Groq LLaMA3 70B Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: memoryOnline ? '#8B5CF6' : '#EF4444', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            Cognee Memory {memoryOnline ? 'Active' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
