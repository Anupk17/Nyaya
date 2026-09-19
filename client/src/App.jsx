import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MessageSquare, FileText, BarChart2 } from 'lucide-react';
import { FloatingDock } from '@/components/ui/floating-dock';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import HistoryPanel from './components/HistoryPanel';
import AIChatWorkspace from './pages/AIChatWorkspace';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import Impact from './pages/Impact';
import LiveDispute from './pages/LiveDispute';
import { seedInitialMemory } from './lib/cogneeMemory';

function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [useBedrock, setUseBedrock] = useState(false);

  useEffect(() => {
    // Only seed once — check localStorage flag
    const seeded = localStorage.getItem('nyaya_memory_seeded');
    if (!seeded) {
      seedInitialMemory().then(() => {
        localStorage.setItem('nyaya_memory_seeded', 'true');
      });
    }
  }, []);

  return (
    <Router>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isHistoryOpen ? '240px 1fr 280px' : '240px 1fr',
          height: '100vh',
          overflow: 'hidden',
          background: '#F3F4F6',
        }}
      >
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <TopHeader
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
            useBedrock={useBedrock}
            setUseBedrock={setUseBedrock}
          />
          {/* Content — each page manages its own scroll */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <Routes>
              <Route path="/"             element={<AIChatWorkspace useBedrock={useBedrock} />} />
              <Route path="/chat"         element={<AIChatWorkspace useBedrock={useBedrock} />} />
              <Route path="/live-dispute" element={<LiveDispute useBedrock={useBedrock} />} />
              <Route path="/cases"        element={<Dashboard />} />
              <Route path="/case/:id"     element={<CaseDetail />} />
              <Route path="/impact"       element={<Impact />} />
            </Routes>
          </div>
        </div>

        {/* Right History Panel */}
        {isHistoryOpen && <HistoryPanel />}

        {/* Floating Dock Navigation */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <FloatingDock 
            items={[
              { title: 'AI Dispute', icon: <MessageSquare className="w-5 h-5" />, href: '/' },
              { title: 'Cases Queue', icon: <FileText className="w-5 h-5" />, href: '/cases' },
              { title: 'Analytics', icon: <BarChart2 className="w-5 h-5" />, href: '/impact' },
            ]}
            desktopClassName="shadow-xl border border-gray-200"
          />
        </div>
      </div>
    </Router>
  );
}

export default App;
