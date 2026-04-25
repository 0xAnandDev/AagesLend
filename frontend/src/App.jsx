import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { Web3Provider } from './contexts/Web3Context';
import { PriceProvider } from './contexts/PriceContext';
import { NotificationProvider } from './contexts/NotificationContext';
// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Lend from './pages/Lend';
import Borrow from './pages/Borrow';
import MyLoans from './pages/MyLoans';
import Liquidations from './pages/Liquidations';
import ActivityPage from './pages/ActivityPage';
import Settings from './pages/Settings';
import Insights from './pages/Insights';
import TestLab from './pages/TestLab';
import './services/blockchainService';
import addresses from './utils/addresses.json';

const AppLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const App = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addresses = addresses;
    }
  }, []);

  return (
    <Web3Provider>
      <NotificationProvider>
        <PriceProvider>
          <Router>
            <Routes>
              {/* Landing Page without Layout */}
              <Route path="/" element={<LandingPage />} />

              {/* Internal Pages with Layout wrapper */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/lend" element={<Lend />} />
                <Route path="/borrow" element={<Borrow />} />
                <Route path="/loans" element={<MyLoans />} />
                <Route path="/liquidations" element={<Liquidations />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/test-lab" element={<TestLab />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
        </PriceProvider>
      </NotificationProvider>
    </Web3Provider>
  );
};

export default App;
