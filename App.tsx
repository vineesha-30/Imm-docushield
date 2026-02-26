
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import WizardPage from './pages/WizardPage';
import AuditPage from './pages/AuditPage';
import PricingPage from './pages/PricingPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import { supabase } from './services/supabaseClient';

// Domain Types for Agile Routing
type DomainContext = 'LANDING' | 'APP' | 'ADMIN';

interface AuthContextType {
  user: { role: 'admin' | 'user' | null, name: string, email?: string, id?: string } | null;
  login: (role: 'admin' | 'user', name: string) => void;
  logout: () => void;
  domain: DomainContext;
  setDomain: (d: DomainContext) => void;
  isSimulated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const Navbar: React.FC = () => {
  const { domain, user, logout } = useAuth();
  const location = useLocation();

  if (domain === 'ADMIN' || location.pathname === '/login') return null;

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-100">
              <span className="text-white font-bold text-xs italic">DS</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">DOCUSHIELD</span>
          </Link>
          
          <div className="hidden md:flex space-x-8 items-center">
            {domain === 'LANDING' && (
              <>
                <Link to="/pricing" className="text-slate-500 hover:text-red-600 font-semibold text-sm transition">Pricing</Link>
                {user ? (
                  <Link to="/dashboard" className="text-red-600 font-bold text-sm">Dashboard →</Link>
                ) : (
                  <Link to="/login" className="text-slate-500 hover:text-red-600 font-semibold text-sm transition">Login</Link>
                )}
              </>
            )}
            
            {domain === 'APP' && (
              <>
                <Link to="/dashboard" className="text-slate-500 hover:text-red-600 font-semibold text-sm transition">My Applications</Link>
                <div className="h-4 w-px bg-slate-200 mx-2"></div>
                <button onClick={logout} className="text-slate-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest transition">Sign Out</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const DomainSwitcher: React.FC = () => {
  const { domain, setDomain } = useAuth();
  const navigate = useNavigate();

  const configs = [
    { type: 'LANDING' as const, label: 'immcanadian.com', icon: '🌐' },
    { type: 'APP' as const, label: 'app.immcanadian.com', icon: '👤' },
    { type: 'ADMIN' as const, label: 'admin.immcanadian.com', icon: '🛡️' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-auto">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-1.5 flex items-center space-x-1 ring-1 ring-white/10">
        <div className="px-4 py-2 border-r border-slate-700 mr-1 hidden lg:block">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 block leading-none mb-1">PROTOTYPE MODE</span>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-white opacity-80 uppercase tracking-tighter">Domain: {domain}</span>
          </div>
        </div>
        {configs.map((cfg) => (
          <button
            key={cfg.type}
            onClick={() => {
              setDomain(cfg.type);
              navigate(cfg.type === 'LANDING' ? '/' : cfg.type === 'APP' ? '/dashboard' : '/admin');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
              domain === cfg.type 
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40 scale-105' 
                : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <span className="text-lg">{cfg.icon}</span>
            <div className="text-left hidden md:block">
              <span className="text-[10px] font-black block leading-none mb-0.5">{cfg.label.split('.')[0].toUpperCase()}</span>
              <span className="text-[9px] opacity-60 block leading-none font-mono">switch</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<{ role: 'admin' | 'user' | null, name: string, id?: string } | null>(null);
  const [domain, setDomain] = useState<DomainContext>('LANDING');
  const [isSimulated, setIsSimulated] = useState(true);

  useEffect(() => {
    const host = window.location.hostname;
    
    // Check if we are running in a known production domain
    const isProduction = host.includes('immcanadian.com');
    setIsSimulated(!isProduction);

    if (host.startsWith('admin.')) {
      setDomain('ADMIN');
    } else if (host.startsWith('app.')) {
      setDomain('APP');
    } else {
      setDomain('LANDING');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser({ role: 'user', name: session.user.email?.split('@')[0] || 'User', id: session.user.id });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setUser({ role: 'user', name: session.user.email?.split('@')[0] || 'User', id: session.user.id });
      else {
        const saved = localStorage.getItem('ds_auth');
        if (saved) setUser(JSON.parse(saved));
        else setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (role: 'admin' | 'user', name: string) => {
    const newUser = { role, name };
    setUser(newUser);
    localStorage.setItem('ds_auth', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ds_auth');
    supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, domain, setDomain, isSimulated }}>
      <HashRouter>
        <div className="flex flex-col min-h-screen relative">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {domain === 'LANDING' && (
                <>
                  <Route path="/" element={<Home />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}

              {domain === 'APP' && (
                <>
                  <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                  <Route path="/wizard" element={user ? <WizardPage /> : <Navigate to="/login" />} />
                  <Route path="/audit/:id" element={user ? <AuditPage /> : <Navigate to="/login" />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}

              {domain === 'ADMIN' && (
                <>
                  <Route path="/admin" element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/login" />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </>
              )}
            </Routes>
          </main>
          {/* Simulation toggle is only visible on localhost/preview URLs */}
          {isSimulated && <DomainSwitcher />}
        </div>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
