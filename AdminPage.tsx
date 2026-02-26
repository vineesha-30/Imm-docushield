
import React, { useState, useEffect } from 'react';
import { VisaType, UserApplication, Severity } from '../types';
import { VISA_PROGRAMS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

type AdminTab = 'DASHBOARD' | 'PROGRAMS' | 'CHECKLIST' | 'RULES' | 'SUBSCRIPTIONS' | 'LOGS';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [apps, setApps] = useState<UserApplication[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<VisaType>(VisaType.VISITOR);

  useEffect(() => {
    const saved = localStorage.getItem('ds_applications');
    if (saved) {
      setApps(JSON.parse(saved));
    }
  }, []);

  const totalAudits = apps.length;
  const avgReadinessAcrossAll = apps.length > 0 
    ? (apps.reduce((sum, a) => sum + (a.readinessScore?.overall || 0), 0) / apps.length).toFixed(1)
    : "0.0";
  
  const programCounts = apps.reduce((acc, app) => {
    acc[app.visaType] = (acc[app.visaType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const visaDistData = Object.entries(programCounts).map(([name, value]) => ({ 
    name: name.split(' ')[0], 
    value 
  }));

  const renderDashboard = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Live Audits', value: totalAudits.toString(), trend: '+0% Growth', icon: '📊' },
          { label: 'Avg System Score', value: `${avgReadinessAcrossAll}%`, trend: 'Performance', icon: '🎯' },
          { label: 'Active Sessions', value: '1', trend: 'Current', icon: '⚡' },
          { label: 'Fraud Alerts', value: apps.reduce((s, a) => s + (a.issues?.filter(i => i.type === 'Risk').length || 0), 0).toString(), trend: 'High Priority', icon: '🛡️', warning: true }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${stat.warning ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-4xl font-black text-white">{stat.value}</div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 block">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-10 rounded-[2.5rem] border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-8 tracking-tight">System Distribution</h3>
          <div className="h-[300px]">
            {totalAudits > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visaDistData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                  <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">No activity yet.</div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 p-10 rounded-[2.5rem] border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-8 tracking-tight">Recent Anomalies</h3>
          <div className="space-y-4">
            {apps.slice(0, 4).map((app, i) => (
              <div key={i} className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                <span className="text-[9px] font-black text-red-500 uppercase block mb-1">Alert ID {app.id.slice(-4)}</span>
                <p className="text-sm text-slate-300 font-medium">{app.visaType} Audit Resulted in Score: {app.readinessScore?.overall}%</p>
              </div>
            ))}
            {apps.length === 0 && <p className="text-slate-500 italic text-sm">Waiting for live data ingestion...</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrograms = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-black text-white">Canada Visa Programs</h2>
        <button className="bg-red-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition shadow-lg">Create New Program</button>
      </div>
      <div className="bg-slate-800 rounded-[2rem] border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Program</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logic Health</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audits Run</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {VISA_PROGRAMS.map((p) => (
              <tr key={p.id} className="hover:bg-slate-700/30 transition">
                <td className="px-8 py-6">
                  <div className="font-bold text-white">{p.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{p.id}</div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs text-slate-400 font-medium">Temporary Resident</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-black uppercase text-green-500">Optimized</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-mono text-slate-300">
                  {apps.filter(a => a.visaType === p.id).length}
                </td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => { setSelectedProgramId(p.id as VisaType); setActiveTab('CHECKLIST'); }} className="text-red-500 hover:text-white font-bold text-xs uppercase tracking-widest">Manage Checklist →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChecklist = () => {
    const program = VISA_PROGRAMS.find(p => p.id === selectedProgramId);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
        <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 h-fit">
          <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Select Program</h3>
          <div className="space-y-2">
            {VISA_PROGRAMS.map(p => (
              <button 
                key={p.id} 
                onClick={() => setSelectedProgramId(p.id as VisaType)}
                className={`w-full text-left p-4 rounded-xl transition-all font-bold text-sm ${selectedProgramId === p.id ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-700'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 p-10 rounded-[2.5rem] border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-8 tracking-tight">Checklist Config: {program?.label}</h3>
            <div className="space-y-4">
              {program?.checklist.map((req) => (
                <div key={req.id} className="p-6 bg-slate-900/50 rounded-2xl border border-slate-700 flex items-center justify-between group hover:border-slate-500 transition">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white transition">📄</div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{req.label}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{req.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Mandatory</span>
                      <input type="checkbox" defaultChecked={req.required} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-red-600 focus:ring-red-600 focus:ring-offset-slate-800" />
                    </div>
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500">Edit</button>
                  </div>
                </div>
              ))}
              <button className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-bold hover:border-red-500 hover:text-red-500 transition text-sm">+ Add Requirement</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRules = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-slate-800 p-10 rounded-[2.5rem] border border-slate-700 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <span className="text-9xl font-black text-white">AI</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">AI Logic Engine (Master Prompt)</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-10">Currently deployed: Steps 1-6 Audit Framework</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { step: '01', title: 'Requirement Mapping', desc: 'Auto-verification of mandatory documents based on program registry.' },
              { step: '02', title: 'Authenticity Check', desc: 'Verification of stamps, seals, and OCR metadata consistency.' },
              { step: '03', title: 'Cross-Document Validation', desc: 'Strict match checking for Passport, IMM forms, and Financials.' },
              { step: '04', title: 'Program Specific Logic', desc: 'Financial sufficiency vs. Duration of stay calculations.' },
              { step: '05', title: 'Risk Scoring Matrix', desc: 'Weighting severity levels from MUST_FIX to OPTIONAL.' },
              { step: '06', title: 'System Finalization', desc: 'Output of finalized readiness score and breakdown.' }
            ].map((rule) => (
              <div key={rule.step} className="p-6 bg-slate-900/80 rounded-3xl border border-slate-700 hover:border-red-600 transition group cursor-help">
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-xl font-black text-red-600 group-hover:scale-110 transition-transform">{rule.step}</span>
                  <h4 className="font-black text-white text-lg tracking-tight">{rule.title}</h4>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Users', value: '1,284', icon: '💎' },
          { label: 'MRR (Simulated)', value: '$24,500', icon: '📈' },
          { label: 'Audit Volume', value: '4.2k/mo', icon: '🚀' }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 text-center">
            <span className="text-2xl mb-2 block">{stat.icon}</span>
            <div className="text-4xl font-black text-white tracking-tight mb-1">{stat.value}</div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-[2rem] border border-slate-700 overflow-hidden">
        <div className="p-8 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-black text-white tracking-tight">Subscription Distribution</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-900/30">
            <tr>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plan Tier</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price Point</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Share</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Revenue Contrib.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-sm">
            {[
              { name: 'Complete Shield', price: '$199', share: '14%', rev: '45%', color: 'text-red-500' },
              { name: 'Smart Shield', price: '$99', share: '62%', rev: '48%', color: 'text-blue-500' },
              { name: 'Basic Shield', price: '$49', share: '24%', rev: '7%', color: 'text-green-500' }
            ].map((plan, i) => (
              <tr key={i} className="hover:bg-slate-700/20">
                <td className={`px-8 py-6 font-black ${plan.color}`}>{plan.name}</td>
                <td className="px-8 py-6 text-slate-300 font-bold">{plan.price}</td>
                <td className="px-8 py-6 text-slate-400">{plan.share}</td>
                <td className="px-8 py-6 text-right text-white font-black">{plan.rev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const sidebarItems = [
    { id: 'DASHBOARD' as const, label: 'Overview', icon: '🏠' },
    { id: 'PROGRAMS' as const, label: 'Visa Programs', icon: '📄' },
    { id: 'CHECKLIST' as const, label: 'Checklists', icon: '📋' },
    { id: 'RULES' as const, label: 'AI Rules', icon: '🧠' },
    { id: 'SUBSCRIPTIONS' as const, label: 'Subscriptions', icon: '💎' },
    { id: 'LOGS' as const, label: 'System Logs', icon: '🔐' },
  ];

  return (
    <div className="bg-slate-900 min-h-screen text-slate-300 flex">
      {/* Sidebar */}
      <aside className="w-72 h-screen border-r border-slate-800 flex flex-col fixed left-0 bg-slate-900 z-10">
        <div className="p-10 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-red-900/50">DS</div>
          <div className="leading-none">
            <span className="text-white font-black text-xl block tracking-tighter">OPS PORTAL</span>
            <span className="text-red-500 text-[8px] font-black uppercase tracking-widest">Real-Time Data Mode</span>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${
                activeTab === item.id 
                ? 'bg-red-600 text-white shadow-2xl shadow-red-900/40 translate-x-1' 
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-72 p-12 overflow-x-hidden">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
              {activeTab === 'DASHBOARD' ? "Overview" : 
               activeTab === 'PROGRAMS' ? "Programs" :
               activeTab === 'CHECKLIST' ? "Checklist" :
               activeTab === 'RULES' ? "Rules" :
               activeTab === 'SUBSCRIPTIONS' ? "Subscriptions" : "Logs"}
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4">Aggregating cross-user audit intelligence from local vault</p>
          </div>
          <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700 flex items-center space-x-4">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engine Status</span>
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-xs font-bold text-white uppercase tracking-tighter">Healthy</span>
          </div>
        </header>

        {activeTab === 'DASHBOARD' && renderDashboard()}
        {activeTab === 'PROGRAMS' && renderPrograms()}
        {activeTab === 'CHECKLIST' && renderChecklist()}
        {activeTab === 'RULES' && renderRules()}
        {activeTab === 'SUBSCRIPTIONS' && renderSubscriptions()}
        {activeTab === 'LOGS' && (
           <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl animate-fadeIn">
              <div className="p-8 bg-slate-900/50 border-b border-slate-700">
                <h3 className="text-xl font-black text-white">System Events</h3>
              </div>
              <div className="divide-y divide-slate-700/50">
                {apps.map((a, i) => (
                  <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-700/10">
                    <div className="flex items-center space-x-6">
                      <span className="text-[10px] font-black text-slate-500 uppercase w-20">Just Now</span>
                      <span className="text-sm text-slate-300"><strong className="text-white">Audit Completed:</strong> {a.visaType} (Score: {a.readinessScore?.overall}%)</span>
                    </div>
                    <span className="text-[8px] font-black bg-slate-900 px-2 py-0.5 rounded text-slate-500">PROCESSED</span>
                  </div>
                ))}
                {apps.length === 0 && <div className="p-12 text-center text-slate-500 italic">No activity recorded.</div>}
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
