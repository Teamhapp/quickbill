
import React, { useState } from 'react';
import { StorageService } from '../services/storage';

interface AuthViewProps {
  onLogin: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Artificial delay for feedback
    setTimeout(() => {
      if (isSignup) {
        if (!email || !password || !businessName) {
          setError('All fields are required');
          setLoading(false);
          return;
        }
        const success = StorageService.signup(email, password, businessName);
        if (success) {
          StorageService.login(email, password);
          onLogin();
        } else {
          setError('Email already registered');
        }
      } else {
        const success = StorageService.login(email, password);
        if (success) {
          onLogin();
        } else {
          setError('Invalid email or password');
        }
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-600 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <div className="inline-block p-3 bg-indigo-50 rounded-2xl mb-2">
            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">QuickBill India</h1>
          <p className="text-slate-500 font-medium">
            {isSignup ? 'Create your free account' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 error-shake">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                placeholder="e.g. Dhanam Agencies"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : isSignup ? 'CREATE FREE ACCOUNT' : 'LOGIN TO DASHBOARD'}
          </button>
        </form>

        <div className="text-center pt-4">
          <button
            onClick={() => { setIsSignup(!isSignup); setError(''); }}
            className="text-indigo-600 font-bold text-sm hover:underline"
          >
            {isSignup ? 'Already have an account? Sign In' : "New to QuickBill? Create Account"}
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100">
           <p className="text-[10px] text-slate-400 text-center uppercase tracking-[0.2em] font-black">Fastest Invoicing Engine in India</p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
