import React, { useState } from 'react';
import { MessageSquare, FileText, BarChart2 } from 'lucide-react';
import { FloatingDock } from '@/components/ui/floating-dock';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import HistoryPanel from './HistoryPanel';

export default function AppLayout({ children, useBedrock, setUseBedrock }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isHistoryOpen ? '240px 1fr 280px' : '240px 1fr',
        height: '100vh',
        overflow: 'hidden',
        background: '#F3F4F6',
      }}
    >
      <Sidebar />

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopHeader
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          useBedrock={useBedrock}
          setUseBedrock={setUseBedrock}
        />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>

      {isHistoryOpen && <HistoryPanel />}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <FloatingDock 
          items={[
            { title: 'AI Dispute', icon: <MessageSquare className="w-5 h-5" />, href: '/chat' },
            { title: 'Cases Queue', icon: <FileText className="w-5 h-5" />, href: '/cases' },
            { title: 'Analytics', icon: <BarChart2 className="w-5 h-5" />, href: '/impact' },
          ]}
          desktopClassName="shadow-xl border border-gray-200"
        />
      </div>
    </div>
  );
}
