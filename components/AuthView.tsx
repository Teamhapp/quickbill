
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

    setTimeout(() => {
      if (isSignup) {
        if (!email || !password || !businessName) {
          setError('Please fill all fields');
          setLoading(false);
          return;
        }
        const success = StorageService.signup(email, password, businessName);
        if (success) {
          StorageService.login(email, password);
          onLogin();
        } else {
          setError('Email already exists');
        }
      } else {
        const success = StorageService.login(email, password);
        if (success) {
          onLogin();
        } else {
          setError('Invalid credentials');
        }
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full space-y-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 mb-4 transform -rotate-6">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">QuickBill Pro</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Precision Invoicing Engine</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-bounce">
             {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignup && (
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
              placeholder="Business Name"
            />
          )}
          
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
            placeholder="Email Address"
          />

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
            placeholder="Secure Password"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-indigo-800 uppercase tracking-widest text-sm`}
          >
            {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Access Workspace'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => { setIsSignup(!isSignup); setError(''); }}
            className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors"
          >
            {isSignup ? 'Already Registered? Sign In' : 'New? Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
