import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LeadsProvider } from './context/LeadsContext'; // ✅ Named import
// OR use default import:
// import LeadsProvider from './context/LeadsContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LeadFinder from './pages/LeadFinder';
import CampaignOutreach from './pages/CampaignOutreach';
import LeadManager from './pages/LeadManager';
import EmailExtractor from './pages/EmailExtractor';

function App() {
  return (
    <BrowserRouter>
      <LeadsProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Sidebar />
          <div className="lg:ml-64 min-h-screen p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/lead-finder" element={<LeadFinder />} />
              <Route path="/campaign-outreach" element={<CampaignOutreach />} />
              <Route path="/lead-manager" element={<LeadManager />} />
              <Route path="/email-extractor" element={<EmailExtractor />} />
            </Routes>
          </div>
        </div>
      </LeadsProvider>
    </BrowserRouter>
  );
}

export default App;
