
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-slate-50 pt-20 pb-24 border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span>Trusted by 10,000+ Canadian Applicants</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Protect Your Canada Visa Application <span className="text-red-600">Before</span> You Submit
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              DocuShield audits your entire document package for accuracy, completeness, and consistency — so small mistakes don’t cause big rejections.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center lg:justify-start">
              <Link to="/login" className="bg-red-600 text-white text-lg px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition transform hover:-translate-y-1 shadow-lg shadow-red-200 text-center">
                👉 Start Document Audit
              </Link>
              <Link to="/pricing" className="bg-white text-slate-900 border border-slate-300 text-lg px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition text-center">
                See How It Works
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 transform rotate-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">📄</div>
                  <div>
                    <div className="h-2 w-24 bg-slate-200 rounded mb-1"></div>
                    <div className="h-2 w-16 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="text-red-600 font-bold text-sm">🔴 Must Fix</div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-red-800 font-bold text-sm">Conflict Detected</p>
                  <p className="text-red-600 text-xs">Date of birth on Passport (1990-05-12) does not match Application Form IMM5257 (1990-12-05).</p>
                </div>
                <div className="h-4 w-full bg-slate-50 rounded"></div>
                <div className="h-4 w-3/4 bg-slate-50 rounded"></div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-400 text-xs italic">Audit Score: 68%</span>
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-red-500"></div>
                </div>
              </div>
            </div>
            {/* Aesthetic Background Shapes */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10 animate-blob"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10 animate-blob animation-delay-2000"></div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Why Applications Get Rejected</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">IRCC does not fix mistakes. They refuse applications. Don't let a small oversight cost your Canadian dream.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-2xl mb-6">❌</div>
              <h3 className="text-xl font-bold mb-3">Missing Documents</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Failing to include a mandatory form or proof as per the specific IRCC checklist for your visa stream.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-2xl mb-6">⚠️</div>
              <h3 className="text-xl font-bold mb-3">Conflict Data</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Names, dates, or employment history that don't match across different forms and supporting documents.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-2xl mb-6">✍️</div>
              <h3 className="text-xl font-bold mb-3">Careless Typos</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Incorrect passport numbers, UCI numbers, or miscalculated balances in financial proof documents.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Audited in 4 Simple Steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { step: '01', title: 'Select Visa Type', desc: 'Choose from Visitor, Study, Work, or Express Entry.' },
              { step: '02', title: 'Upload Files', desc: 'Step-by-step guided wizard for all mandatory documents.' },
              { step: '03', title: 'AI-Powered Audit', desc: 'Our engine cross-checks every single detail for accuracy.' },
              { step: '04', title: 'Fix & Submit', desc: 'Get a clear fix report and submit to IRCC with 100% confidence.' }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-5xl font-black text-slate-200 mb-4">{item.step}</div>
                <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust/Legal Banner */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm italic uppercase tracking-widest mb-4">Non-Legal Compliance Notice</p>
          <p className="text-white text-lg font-medium leading-relaxed">
            "DocuShield is built specifically for self-filers who want to ensure their paperwork is perfect. We provide document verification based on IRCC standards, without the high costs of legal consultants."
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
