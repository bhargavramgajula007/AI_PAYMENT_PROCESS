
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import QueueView from './pages/QueueView';
import GraphView from './pages/GraphView';
import CopilotView from './pages/CopilotView';
import CaseView from './pages/CaseView';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import TradingPortal from './pages/TradingPortal';
import TradingLandingPage from './pages/TradingLandingPage';
import ClientPortal from './pages/ClientPortal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/trade" element={<TradingLandingPage />} />
                    <Route path="/client" element={<ClientPortal />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* Client Trading Route - Standalone (no admin nav) */}
                    <Route path="/trading" element={<ProtectedRoute><TradingPortal /></ProtectedRoute>} />

                    {/* Protected Admin Routes - With Layout */}
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/queue" element={<QueueView />} />
                        <Route path="/cases/:id" element={<CaseView />} />
                        <Route path="/cases" element={<Navigate to="/queue" replace />} />
                        <Route path="/graph" element={<GraphView />} />
                        <Route path="/copilot" element={<CopilotView />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;

