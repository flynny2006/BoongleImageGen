import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import type { AuthMode } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void; // Callback after successful login/registration
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setMessage('Logged in successfully!');
      } else { // register
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          // Options can be added here if needed, e.g., for email confirmation screen
          // options: {
          //   emailRedirectTo: window.location.origin,
          // }
        });
        if (signUpError) throw signUpError;
        setMessage('Registration successful! Please check your email to confirm your account if email confirmation is enabled.');
      }
      onAuthSuccess(); // Call success callback
      // onClose(); // Optionally close modal on success, or let user close
    } catch (err: any) {
      setError(err.error_description || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'login' ? 'register' : 'login');
    setError(null);
    setMessage(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
    >
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md ring-1 ring-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 id="auth-modal-title" className="text-2xl font-bold text-sky-300">
            {mode === 'login' ? 'Login to Boongle' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close authentication modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleAuth}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-slate-100 placeholder-slate-400"
              placeholder="you@example.com"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password"className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-slate-100 placeholder-slate-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          {message && <p className="text-green-400 text-sm mb-4">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-all duration-150 disabled:opacity-60"
          >
            {loading ? (mode === 'login' ? 'Logging in...' : 'Registering...') : (mode === 'login' ? 'Login' : 'Create Account')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={toggleMode} className="font-medium text-sky-400 hover:text-sky-300 hover:underline">
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};
