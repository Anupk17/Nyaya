import React from 'react';
import { WobbleCard } from '@/components/ui/wobble-card';

const ACCENT = {
  total:     '#6366F1',
  pending:   '#F59E0B',
  resolved:  '#10B981',
  escalated: '#EF4444',
};

function StatCard({ icon: Icon, label, value, subtext, accent }) {
  const color = ACCENT[accent] || '#F97316';
  return (
    <WobbleCard
      containerClassName="flex-1 min-w-0 h-full p-0 bg-white"
      className="p-0"
    >
      <div 
        className="h-full relative z-20 flex items-start justify-between"
        style={{
          border: '1px solid #E5E7EB',
          borderLeft: `3px solid ${color}`,
          borderRadius: 12,
          padding: '20px 24px',
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
            {value}
          </div>
          {subtext && (
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
              {subtext}
            </div>
          )}
        </div>
        {Icon && (
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={color} />
          </div>
        )}
      </div>
    </WobbleCard>
  );
}

export default StatCard;
