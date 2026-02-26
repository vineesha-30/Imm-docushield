
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const LoginPage: React.FC = () => {
  const { login, setDomain } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'signin' | 'register'>('signin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = (role: 'admin' | 'user', name: string) => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      login(role, name);
      if (role === 'admin') {
        setDomain('ADMIN');
        navigate('/admin');
      } else {
        setDomain('APP');
        // If it's a new registration, maybe send them to the wizard directly
        navigate(view === 'register' ? '/wizard' : '/dashboard');
      }
      setLoading(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin('user', formData.name || 'Alex Applicant');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Branding & Header */}
        <div className="text-center mb-10">
          <div 
            onClick={() => { setDomain('LANDING'); navigate('/'); }}
            className="mx-auto h-16 w-16 bg-red-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-red-200 rotate-3 transition hover:rotate-0 cursor-pointer mb-8"
          >
            DS
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {view === 'signin' ? 'Protect Your Future.' : 'Join the Shield.'}
          </h2>
          <p className="mt-4 text-slate-500 font-medium px-4">
            {view === 'signin' 
              ? 'Log in to your DocuShield vault and secure your path to Canada.' 
              : 'Create your secure vault today and start your professional document audit.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 p-8 md:p-10 border border-slate-100">
          {/* Tab Switcher */}
          <div className="p-1.5 bg-slate-100 rounded-2xl flex mb-10">
            <button 
              onClick={() => setView('signin')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl ${
                view === 'signin' 
                ? 'text-slate-900 bg-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setView('register')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl ${
                view === 'register' 
                ? 'text-slate-900 bg-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {view === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-bold text-slate-900"
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="name@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                {view === 'signin' && (
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700">Forgot?</button>
                )}
              </div>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-bold text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-red-600 text-white py-5 rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-red-200 transition-all flex items-center justify-center space-x-3 group active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{view === 'signin' ? 'Sign In' : 'Create Applicant Account'}</span>
                  <span className="opacity-50 group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          {view === 'signin' && (
            <div className="mt-8 pt-8 border-t border-slate-50">
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Demo Access</p>
              <button
                onClick={() => handleLogin('admin', 'Internal Auditor')}
                className="w-full flex items-center justify-between p-5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all group"
              >
                <div className="text-left">
                  <span className="block font-black text-sm">Internal Ops Portal</span>
                  <span className="block text-[9px] opacity-60 uppercase font-black tracking-widest mt-0.5">Auditor / Admin View</span>
                </div>
                <span className="text-xl group-hover:scale-110 transition-transform">🛡️</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center space-y-8">
          <button
            onClick={() => { setDomain('LANDING'); navigate('/'); }}
            className="text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-widest transition flex items-center justify-center space-x-2 mx-auto"
          >
            <span>← Back to immcanadian.com</span>
          </button>

          <div className="p-6 bg-white/50 rounded-2xl border border-slate-100 inline-block max-w-xs mx-auto">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-2">Simulated Environment</p>
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              "Registration and login are simulated for the current deployment preview."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
