import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import WelcomeModal from './components/WelcomeModal';
import NewLanding from './pages/NewLanding';
import AIChatWorkspace from './pages/AIChatWorkspace';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import Impact from './pages/Impact';
import LiveDispute from './pages/LiveDispute';
import TrainingStudio from './pages/TrainingStudio';
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

  // Inner layout wrapper
  const MainLayout = () => (
    <AppLayout useBedrock={useBedrock} setUseBedrock={setUseBedrock}>
      <Outlet />
    </AppLayout>
  );

  return (
    <Router>
      <WelcomeModal />
      <Routes>
        <Route path="/" element={<NewLanding />} />
        
        <Route element={<MainLayout />}>
          <Route path="/chat"         element={<AIChatWorkspace useBedrock={useBedrock} />} />
          <Route path="/live-dispute" element={<LiveDispute useBedrock={useBedrock} />} />
          <Route path="/cases"        element={<Dashboard />} />
          <Route path="/case/:id"     element={<CaseDetail />} />
          <Route path="/impact"       element={<Impact />} />
          <Route path="/training"     element={<TrainingStudio />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
