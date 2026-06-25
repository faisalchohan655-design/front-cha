import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import LeadFinder from "./pages/LeadFinder";
import CampaignOutreach from "./pages/CampaignOutreach";
import LeadManager from "./pages/LeadManager";
import EmailExtractor from "./pages/EmailExtractor";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <div className="flex-1 p-6">
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/finder"
              element={
                <LeadFinder />
              }
            />

            <Route
              path="/campaigns"
              element={
                <CampaignOutreach />
              }
            />

            <Route
              path="/manager"
              element={
                <LeadManager />
              }
            />

            <Route
              path="/extractor"
              element={
                <EmailExtractor />
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
