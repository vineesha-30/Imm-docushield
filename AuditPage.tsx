
import React, { useEffect, useState } from 'react';
import { UserApplication, AuditResult } from '../types';
import { useParams, Link, useLocation, Navigate } from 'react-router-dom';

const AuditPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<UserApplication | null>(null);

  useEffect(() => {
    // Try to get from location state first, then localStorage
    if (location.state?.application) {
      setApp(location.state.application);
      setLoading(false);
    } else {
      const saved = JSON.parse(localStorage.getItem('ds_applications') || '[]');
      const found = saved.find((a: any) => a.id === id);
      if (found) {
        setApp(found);
      }
      setLoading(false);
    }
  }, [id, location.state]);

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 border-[6px] border-slate-50 rounded-full"></div>
            <div className="absolute inset-0 border-[6px] border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-red-600">DS</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Retrieving AI Shield Data</h2>
        </div>
      </div>
    );
  }

  if (!app) {
    return <Navigate to="/dashboard" />;
  }

  // Fallback if no new auditResult exists (backward compatibility)
  if (!app.auditResult) {
     return <Navigate to="/dashboard" />; // Or render legacy view
  }

  const { auditResult } = app;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return 'bg-green-100 text-green-700 border-green-200';
      case 'Warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Fail': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pass': return '✓';
      case 'Warning': return '⚠️';
      case 'Fail': return '❌';
      default: return '?';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Risk Badge */}
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                 <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">DocuShield Audit</span>
                 <span className="text-slate-400 text-[10px] font-bold">ID: {app.id.split('_')[1]}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
                {auditResult.visaType} Assessment
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl">{auditResult.summary}</p>
            </div>

            <div className={`px-10 py-8 rounded-[2.5rem] text-center min-w-[200px] border-2 ${
                auditResult.overallRisk === 'High' ? 'bg-red-50 border-red-100 text-red-600' :
                auditResult.overallRisk === 'Medium' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                'bg-green-50 border-green-100 text-green-600'
              }`}>
               <span className="block text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-70">Overall Risk</span>
               <span className="block text-4xl font-black tracking-tighter">{auditResult.overallRisk}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Detailed Checks Column */}
          <div className="lg:col-span-2 space-y-8">
             <h3 className="text-2xl font-black text-slate-900 px-4">Detailed Checks</h3>
             
             {auditResult.checks.map((check, idx) => (
               <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-bold text-slate-900">{check.category}</h4>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(check.status)}`}>
                      {getStatusIcon(check.status)} {check.status}
                    </span>
                 </div>
                 
                 {check.notes && (
                   <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-600 italic">"{check.notes}"</p>
                   </div>
                 )}

                 {check.issues.length > 0 ? (
                   <ul className="space-y-3">
                     {check.issues.map((issue, i) => (
                       <li key={i} className="flex items-start space-x-3 text-sm text-slate-700 font-medium">
                         <span className="text-red-500 mt-1">•</span>
                         <span>{issue}</span>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No issues detected</p>
                 )}
               </div>
             ))}

             {/* Grounding Sources (Google Search Results) */}
             {auditResult.groundingSources && auditResult.groundingSources.length > 0 && (
               <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100">
                 <div className="flex items-center space-x-3 mb-6">
                   <span className="text-2xl">🌍</span>
                   <h4 className="text-lg font-black text-slate-900">Verified Sources (Google Search)</h4>
                 </div>
                 <div className="space-y-3">
                   {auditResult.groundingSources.map((source, idx) => (
                     <a 
                       key={idx} 
                       href={source.uri} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="block p-4 bg-white rounded-xl border border-blue-100 hover:border-blue-300 transition-all group"
                     >
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="text-xs font-bold text-blue-800 mb-1">{source.title || 'Official Source'}</div>
                           <div className="text-[10px] text-slate-400 font-mono truncate max-w-[250px] sm:max-w-md">{source.uri}</div>
                         </div>
                         <span className="text-slate-300 group-hover:text-blue-500 transition">↗</span>
                       </div>
                     </a>
                   ))}
                 </div>
               </div>
             )}
          </div>

          {/* Sidebar: Missing Docs & Recommendations */}
          <div className="space-y-8">
            
            {/* Recommendations */}
            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                 <span>💡</span> Recommendations
              </h3>
              <ul className="space-y-4">
                {auditResult.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm font-medium leading-relaxed opacity-90 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    {rec}
                  </li>
                ))}
                {auditResult.recommendations.length === 0 && <li className="text-sm text-slate-500 italic">None provided.</li>}
              </ul>
            </div>

            {/* Missing Docs */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
               <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                 <span>📂</span> Missing / Not Provided
               </h3>
               {auditResult.missingDocuments.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                   {auditResult.missingDocuments.map((doc, i) => (
                     <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">
                       {doc}
                     </span>
                   ))}
                 </div>
               ) : (
                 <p className="text-sm text-green-600 font-bold">All mandatory documents found.</p>
               )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <button 
                 onClick={handleDownloadPDF}
                 className="w-full bg-white border-2 border-slate-900 text-slate-900 py-4 rounded-2xl font-black hover:bg-slate-50 transition uppercase tracking-widest text-xs"
               >
                 Print Report
               </button>
               <Link 
                 to="/wizard" 
                 className="w-full bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition text-center uppercase tracking-widest text-xs shadow-lg shadow-red-200"
               >
                 Start New Audit
               </Link>
               <Link to="/dashboard" className="text-center text-slate-400 font-bold text-xs hover:text-slate-600">Back to Dashboard</Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuditPage;
