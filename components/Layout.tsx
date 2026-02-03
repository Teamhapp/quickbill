
import React, { useEffect, useState } from 'react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setView: (view: View) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, onLogout }) => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === 'n') { e.preventDefault(); setView('invoice'); }
        if (e.key === 'h') { e.preventDefault(); setView('history'); }
        if (e.key === 'p') { e.preventDefault(); setView('products'); }
        if (e.key === 's') { e.preventDefault(); setView('profile'); }
      }
      if (e.key === '?') {
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setView]);

  const navItems: { label: string; view: View; icon: string; shortcut: string }[] = [
    { label: 'New Bill', view: 'invoice', icon: 'M12 4v16m8-8H4', shortcut: 'Alt+N' },
    { label: 'History', view: 'history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', shortcut: 'Alt+H' },
    { label: 'Products', view: 'products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', shortcut: 'Alt+P' },
    { label: 'Customers', view: 'customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', shortcut: '' },
    { label: 'Settings', view: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', shortcut: 'Alt+S' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Sidebar - Desktop */}
      <aside className="no-print hidden md:flex flex-col w-64 bg-slate-800 text-white p-4 sticky top-0 h-screen shadow-2xl">
        <div className="mb-8 px-2 py-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">QuickBill</h1>
          </div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-2 ml-1">Professional Suite</p>
        </div>
        
        <nav className="flex-1 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`w-full group flex items-center justify-between px-4 py-3.5 text-sm font-bold rounded-xl transition-all ${
                activeView === item.view ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center">
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </div>
              {item.shortcut && (
                <span className={`text-[10px] opacity-0 group-hover:opacity-40 transition-opacity font-mono`}>{item.shortcut}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-slate-700">
          <button 
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="w-full flex items-center px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span className="w-5 h-5 border border-slate-600 rounded flex items-center justify-center mr-2">?</span>
            Keyboard Shortcuts
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
          >
            <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-3 md:p-8 max-w-7xl mx-auto w-full mb-24 md:mb-0 relative overflow-x-hidden">
        {children}
        
        {showShortcuts && (
          <div className="no-print fixed bottom-28 md:bottom-8 right-8 bg-slate-900 text-white p-6 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right-4 duration-300 w-64 border border-slate-700">
            <h4 className="font-black text-xs uppercase text-indigo-400 mb-4 tracking-widest">Quick Keys</h4>
            <div className="space-y-3">
              {navItems.filter(i => i.shortcut).map(i => (
                <div key={i.label} className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400">{i.label}</span>
                  <kbd className="bg-slate-800 px-2 py-1 rounded text-[10px] font-mono border border-slate-700">{i.shortcut}</kbd>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-800">
                <span className="text-slate-400">Save & Print</span>
                <kbd className="bg-indigo-600 px-2 py-1 rounded text-[10px] font-mono">Ctrl + Enter</kbd>
              </div>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="w-full mt-6 py-2 bg-slate-800 rounded-lg text-[10px] font-black uppercase hover:bg-slate-700">Close</button>
          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 flex justify-around p-2 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.1)]">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center flex-1 py-1 rounded-xl transition-all ${
              activeView === item.view ? 'text-indigo-600 scale-105' : 'text-gray-400'
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeView === item.view ? 3 : 2} d={item.icon} />
            </svg>
            <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
