
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Invoice } from '../types';
import { StorageService } from '../services/storage';
import { formatCurrency } from '../services/formatters';

interface ProfileSettingsProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
}

type SettingsTab = 'basics' | 'billing' | 'units' | 'cloud' | 'data';

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onSave }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('basics');
  const [profile, setProfile] = useState<UserProfile>(user);
  const [newUnit, setNewUnit] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [mongoAppId, setMongoAppId] = useState(StorageService.getMongoAppId());

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleSave = () => {
    onSave(profile);
    StorageService.setMongoAppId(mongoAppId);
    setShowToast(true);
  };

  const addUnit = () => {
    if (newUnit && !profile.availableUnits.includes(newUnit)) {
      setProfile({...profile, availableUnits: [...profile.availableUnits, newUnit.toLowerCase()]});
      setNewUnit('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 relative">
      {showToast && (
        <div className="fixed top-8 right-8 z-[100] bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 duration-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
          <span className="font-black text-sm uppercase tracking-widest">Profile Saved!</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Business Profile</h2>
          <p className="text-slate-500 font-medium text-sm">Cloud-powered Indian business suite.</p>
        </div>
        <button onClick={handleSave} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">SAVE CHANGES</button>
      </div>

      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-x-auto no-scrollbar">
        <div className="flex min-w-full sm:min-w-0">
          {[
            { id: 'basics', label: 'Identity' },
            { id: 'billing', label: 'Bank & GST' },
            { id: 'cloud', label: 'Cloud Sync' },
            { id: 'units', label: 'Units' },
            { id: 'data', label: 'Data Mgmt' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex-1 sm:flex-none whitespace-nowrap px-6 sm:px-8 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'basics' && (
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Legal Firm Name</label>
                <input type="text" value={profile.businessName} onChange={e => setProfile({...profile, businessName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Business Address</label>
                <textarea value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contact Number</label>
                <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email ID</label>
                <input type="email" value={profile.email} readOnly className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-400 cursor-not-allowed" />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'cloud' && (
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div>
                  <h3 className="font-black text-slate-900">MongoDB Atlas Integration</h3>
                  <p className="text-xs text-slate-500">Connect to your cloud database for cross-device synchronization.</p>
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Atlas App ID (Realm)</label>
                <input 
                  type="text" 
                  value={mongoAppId} 
                  onChange={e => setMongoAppId(e.target.value)} 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-indigo-600" 
                  placeholder="e.g. data-app-xyz123"
                />
                <p className="mt-3 text-[10px] text-slate-400 italic font-medium">Leave blank to use local storage only. Once set, refresh the page to establish a secure cloud connection.</p>
             </div>
          </section>
        )}

        {/* ... other tabs ... */}
        {activeTab === 'data' && (
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-black text-red-600 mb-2">Danger Zone</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">This will permanently delete all cloud and local invoice history.</p>
              <button onClick={async () => { if(confirm('Permanently delete all data?')) { await StorageService.clearAccountData(); window.location.reload(); } }} className="w-full sm:w-auto px-8 py-4 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black text-sm hover:bg-red-600 hover:text-white transition-all">
                WIPE ALL DATA
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
