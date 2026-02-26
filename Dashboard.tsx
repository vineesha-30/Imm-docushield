
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserApplication, Severity } from '../types';
import { useAuth } from '../App';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<UserApplication[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ds_applications');
    if (saved) {
      setApplications(JSON.parse(saved));
    }
  }, []);

  // Stats
  const criticalFixes = applications.reduce((acc, app) => {
    const appCriticals = app.issues?.filter(issue => issue.severity === Severity.MUST_FIX).length || 0;
    return acc + appCriticals;
  }, 0);

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="animate-fadeIn">
            <div className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <span>Customer Dashboard</span>
              <span>•</span>
              <span className="text-green-600">Active Session</span>
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Welcome back, <span className="text-slate-900">{user?.name || 'Alex Applicant'}</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">Protecting your path to Canada, one document at a time.</p>
          </div>
          <Link to="/wizard" className="bg-red-600 text-white px-10 py-5 rounded-[1.5rem] font-black hover:bg-red-700 transition shadow-2xl shadow-red-200 flex items-center space-x-3 group active:scale-95">
            <span>+ Start New Audit</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Card 1: Total Audits */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all">
            <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] block mb-2">Total Audits</span>
            <div className="flex items-baseline space-x-1">
               <span className="text-6xl font-black text-slate-900 tracking-tighter">{applications.length}</span>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">Lifetime</p>
          </div>

          {/* Card 2: Critical Fixes */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
            <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] block mb-2">Issues Found</span>
            <div className="flex items-baseline space-x-1">
               <span className="text-6xl font-black text-red-600 tracking-tighter">{criticalFixes}</span>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">Across all apps</p>
          </div>

          {/* Card 3: Plan Level */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
            <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] block mb-2">Plan Level</span>
            <div className="flex items-baseline space-x-1">
               <span className="text-6xl font-black text-blue-600 tracking-tighter">Smart</span>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">Shield active</p>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-10 py-10 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Applications</h2>
            <Link to="/wizard" className="text-slate-400 hover:text-red-600 font-black text-[10px] uppercase tracking-[0.2em] transition">View All</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/30">
                <tr>
                  <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Visa Type</th>
                  <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Status</th>
                  <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Risk / Score</th>
                  <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Updated</th>
                  <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition cursor-default">
                    <td className="px-10 py-8">
                      <div className="font-black text-slate-900 text-lg leading-tight">{app.visaType}</div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-tighter mt-1">ID: {app.id.split('_')[1]}</div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${app.status === 'Audited' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                        {app.status === 'Audited' ? 'AUDITED' : 'IN PROGRESS'}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      {app.auditResult ? (
                        <div className={`font-black text-sm uppercase tracking-widest ${
                          app.auditResult.overallRisk === 'High' ? 'text-red-600' : 
                          app.auditResult.overallRisk === 'Medium' ? 'text-amber-500' : 'text-green-600'
                        }`}>
                          {app.auditResult.overallRisk} RISK
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                          <span className="font-black text-slate-900 text-sm">{app.readinessScore?.overall || 0}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-8">
                       <div className="text-sm font-bold text-slate-500">{new Date(app.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <Link 
                        to={`/audit/${app.id}`} 
                        state={{ application: app }}
                        className="bg-white border border-slate-200 text-slate-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition inline-block shadow-sm"
                      >
                        {app.status === 'Audited' ? 'View Report' : 'Continue'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {applications.length === 0 && (
            <div className="py-32 text-center">
              <div className="text-5xl mb-6 grayscale opacity-30">🛡️</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No Audits Active</h3>
              <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Your applications will appear here once you begin an AI-powered verification.</p>
              <Link to="/wizard" className="text-red-600 font-black text-[10px] uppercase tracking-widest mt-8 inline-block hover:underline">Start First Audit →</Link>
            </div>
          )}
        </div>

        {/* Clear History Helper (Dev only) */}
        {applications.length > 0 && (
          <div className="mt-8 text-center">
             <button 
                onClick={() => { localStorage.removeItem('ds_applications'); window.location.reload(); }}
                className="text-slate-300 text-[9px] font-black uppercase tracking-widest hover:text-red-500 transition"
             >
               Delete All Audit Data (Reset Prototype)
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
