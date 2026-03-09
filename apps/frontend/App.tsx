import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { EventProvider, useEvent } from './context/EventContext';
import { OrderPanel } from './pages/OrderPanel';
import { KitchenPanel } from './pages/KitchenPanel';
import { DisplayPanel } from './pages/DisplayPanel';
import { AdminPanel } from './pages/AdminPanel';
import { LayoutDashboard, Camera, Monitor, Printer, Settings } from 'lucide-react';

const Nav: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useEvent();
  
  // Don't show nav if not authenticated OR on the display panel
  if (!isAuthenticated || location.pathname === '/display') return null;

  const linkClass = (path: string) => `
    flex flex-col items-center justify-center p-3 text-xs font-bold uppercase tracking-wider transition-all duration-300
    ${location.pathname === path 
      ? 'text-kopitiam-cream bg-kopitiam-red shadow-lg scale-105 rounded-xl mx-2' 
      : 'text-kopitiam-jade/70 hover:text-kopitiam-dark hover:bg-kopitiam-jade/10'}
  `;

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-kopitiam-cream border-t-2 border-kopitiam-jade/20 z-50 md:top-0 md:left-0 md:w-24 md:h-screen md:flex-col md:border-t-0 md:border-r-2 md:justify-start md:pt-6 shadow-2xl animate-fade-in">
      <div className="hidden md:flex items-center justify-center mb-8 text-kopitiam-red animate-bounce">
        <Camera size={32} strokeWidth={2.5} />
      </div>
      <div className="flex md:flex-col justify-around w-full h-full md:h-auto md:gap-6 px-2 md:px-0">
        <Link to="/" className={linkClass('/')} title="Order">
          <Camera size={24} className="mb-1" />
          <span className="hidden md:block">Booth</span>
        </Link>
        <Link to="/kitchen" className={linkClass('/kitchen')} title="Kitchen">
          <Printer size={24} className="mb-1" />
          <span className="hidden md:block">Lab</span>
        </Link>
        <Link to="/display" className={linkClass('/display')} title="Display">
          <Monitor size={24} className="mb-1" />
          <span className="hidden md:block">Queue</span>
        </Link>
        <Link to="/admin" className={linkClass('/admin')} title="Admin">
          <Settings size={24} className="mb-1" />
          <span className="hidden md:block">Admin</span>
        </Link>
      </div>
    </nav>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useEvent();
  const isDisplay = location.pathname === '/display';
  const showNav = isAuthenticated && !isDisplay;
  
  return (
    <div className="flex h-screen bg-kopitiam-cream font-sans text-kopitiam-dark selection:bg-kopitiam-salmon selection:text-kopitiam-dark">
      <Nav />
      <div className={`flex-1 flex flex-col overflow-hidden ${showNav ? 'pb-20 md:pb-0 md:pl-24' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useEvent();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AppContent: React.FC = () => {
  return (
    <HashRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<OrderPanel />} />
          <Route path="/kitchen" element={
            <ProtectedRoute>
              <KitchenPanel />
            </ProtectedRoute>
          } />
          <Route path="/display" element={
            <ProtectedRoute>
              <DisplayPanel />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </MainLayout>
    </HashRouter>
  );
}

const App: React.FC = () => {
  return (
    <EventProvider>
      <AppContent />
    </EventProvider>
  );
};

export default App;