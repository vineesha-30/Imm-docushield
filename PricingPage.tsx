
import React from 'react';
import { PRICING_PLANS } from '../constants';
import { Link } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const handleStripeCheckout = (planName: string) => {
    console.log(`Initiating Stripe Checkout for ${planName}...`);
    // Future implementation: const stripe = await loadStripe(process.env.STRIPE_KEY);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 mb-4 bg-red-50 rounded-full">
            <span className="text-red-600 text-xs font-black uppercase tracking-widest">Pricing & Plans</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Simple, Secure Protection</h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Choose the shield level that fits your application needs. All plans include 256-bit encryption for your sensitive documents.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          {PRICING_PLANS.map((plan, idx) => (
            <div key={idx} className={`group bg-white rounded-[2.5rem] p-10 border transition-all duration-500 ${plan.popular ? 'border-red-500 shadow-2xl scale-105 relative z-10' : 'border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-red-200">
                  Most Popular
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Self-Filer Protection</p>
              </div>
              
              <div className="mb-8 flex items-baseline">
                <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                <span className="text-slate-400 font-bold ml-2">/pkg</span>
              </div>

              <div className="h-px bg-slate-50 w-full mb-8"></div>

              <ul className="space-y-5 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start space-x-3 text-slate-600">
                    <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-[10px] font-bold">✓</span>
                    </div>
                    <span className="text-sm font-medium leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleStripeCheckout(plan.name)}
                className={`w-full py-5 rounded-2xl font-black transition-all duration-300 transform active:scale-95 flex items-center justify-center space-x-2 ${plan.popular ? 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200' : 'bg-slate-900 text-white hover:bg-black'}`}
              >
                <span>Select {plan.name}</span>
                <span className="opacity-50 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              
              <p className="mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Secure Stripe Checkout
              </p>
            </div>
          ))}
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
          <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white">
            <h4 className="text-2xl font-black mb-6">Payment & Security</h4>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">🛡️</div>
                <div>
                  <p className="font-bold">Encrypted Storage</p>
                  <p className="text-sm text-slate-400">Documents are automatically deleted from Google Cloud Storage after your audit is finalized.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">💳</div>
                <div>
                  <p className="font-bold">Trusted by Stripe</p>
                  <p className="text-sm text-slate-400">All payments are handled by Stripe. DocuShield never stores your credit card details.</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 mb-6">Common Questions</h4>
            <div className="space-y-8">
              <div>
                <p className="font-black text-slate-900 mb-2">Can I audit multiple applicants?</p>
                <p className="text-slate-500 text-sm leading-relaxed">The Complete Shield supports family applications, allowing you to run audits for primary applicants and their dependents simultaneously.</p>
              </div>
              <div>
                <p className="font-black text-slate-900 mb-2">What happens if I fix a mistake?</p>
                <p className="text-slate-500 text-sm leading-relaxed">Smart and Complete plans allow you to re-upload your fixed documents and run a fresh audit at no extra cost until you're 100% ready.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
