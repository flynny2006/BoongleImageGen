import React, { useState } from 'react';
import type { Plan, PlanDetails } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimPlan: (plan: Plan) => void;
  currentPlan: Plan;
  isLoggedIn: boolean; // New prop
  onLoginPrompt: () => void; // New prop to open login modal
}

const plans: PlanDetails[] = [
  {
    name: 'FREE',
    features: ['5 Generations Daily', 'Simple & Fast Generating'],
    generations: 5,
    resetCycle: 'daily',
  },
  {
    name: 'PRO',
    price: '$7.99 / month',
    features: ['175 Generations Monthly', 'Advanced & Fast Gen'],
    claimCode: '6464',
    generations: 175,
    resetCycle: 'monthly',
  },
  {
    name: 'PREMIUM',
    price: '$14.99 / month',
    features: ['Always 2 generation results', 'Unlimited Generations'],
    claimCode: '3636',
    generations: 'Unlimited',
  },
];

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onClaimPlan, currentPlan, isLoggedIn, onLoginPrompt }) => {
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAttemptClaim = (planName?: Plan) => {
    if (!isLoggedIn) {
      onLoginPrompt();
      return;
    }
    setError(null);
    const targetPlan = planName ? plans.find(p => p.name === planName) : plans.find(p => p.claimCode === claimCodeInput);
    
    if (targetPlan) {
      onClaimPlan(targetPlan.name);
      setClaimCodeInput(''); 
    } else if (!planName) { // Only show error if it was a code input attempt
      setError('Invalid claim code. Please try again.');
    }
  };
  
  const handleSwitchPlan = (planName: Plan) => {
    if (!isLoggedIn) {
        onLoginPrompt();
        return;
    }
    if (currentPlan !== planName) {
        onClaimPlan(planName); // This will internally use onClaimPlan after login check
    } else if (planName === 'FREE'){
        onClose(); // If already on Free and click "Continue with Free", just close.
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
    >
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-4xl ring-1 ring-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 id="pricing-modal-title" className="text-3xl font-bold text-sky-300">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close pricing modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-6 rounded-lg shadow-lg flex flex-col ${
                currentPlan === plan.name && isLoggedIn ? 'bg-sky-700/50 ring-2 ring-sky-400' : 'bg-slate-700/70 ring-1 ring-slate-600'
              }`}
            >
              <h3 className="text-2xl font-semibold text-sky-400 mb-1">{plan.name}</h3>
              <p className="text-xl font-bold mb-4">{plan.price || 'Free'}</p>
              <ul className="space-y-2 text-slate-300 mb-6 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-400 mr-2 shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              {currentPlan === plan.name && isLoggedIn ? (
                <p className="text-center text-green-400 font-semibold py-2 px-4 border-2 border-green-400 rounded-md">Current Plan</p>
              ) : plan.claimCode ? (
                <button 
                    onClick={() => { 
                        if (!isLoggedIn) { onLoginPrompt(); return; }
                        setClaimCodeInput(plan.claimCode!); 
                        handleAttemptClaim(plan.name); // Pass plan name to ensure correct plan is claimed
                    }}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-150 hover:shadow-lg"
                >
                  {isLoggedIn ? `Claim ${plan.name} with Code` : 'Login to Claim'}
                </button>
              ) : ( // FREE plan button
                 <button 
                    onClick={() => handleSwitchPlan('FREE')}
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150"
                 >
                    {isLoggedIn ? (currentPlan === 'FREE' ? 'Continue with Free' : 'Switch to Free') : 'Select Free Plan'}
                 </button>
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg">
          <label htmlFor="claimCode" className="block text-lg font-semibold mb-2 text-sky-300">
            Have a Claim Code?
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="claimCode"
              value={claimCodeInput}
              onChange={(e) => setClaimCodeInput(e.target.value.trim())}
              placeholder="Enter a valid code there!"
              className="flex-grow p-3 bg-slate-600 border border-slate-500 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-slate-100 placeholder-slate-400"
            />
            <button
              onClick={() => handleAttemptClaim()}
              disabled={!claimCodeInput && isLoggedIn}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-md shadow-md hover:shadow-green-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-green-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggedIn ? 'Claim Plan' : 'Login to Claim'}
            </button>
          </div>
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
         <button
            onClick={() => handleSwitchPlan('FREE')}
            className="mt-8 w-full sm:w-auto block mx-auto text-slate-400 hover:text-sky-300 underline py-2 px-4 rounded-md transition-colors"
          >
            {isLoggedIn ? (currentPlan === 'FREE' ? "Continue with FREE Plan" : "Revert to FREE Plan") : "Use FREE Plan (Login Required)"}
          </button>
      </div>
    </div>
  );
};
