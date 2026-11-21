import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import LandingPage from "./pages/LandingPage";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Faucet = lazy(() => import("./pages/Faucet"));
const Activity = lazy(() => import("./pages/Activity"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/faucet" element={<Faucet />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/lend" element={<Navigate to="/dashboard" replace />} />
            <Route path="/borrow" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
