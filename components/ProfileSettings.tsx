
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Invoice } from '../types';
import { StorageService } from '../services/storage';
import { formatCurrency } from '../services/formatters';

interface ProfileSettingsProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
}

type SettingsTab = 'basics' | 'billing' | 'units' | 'data';

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onSave }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('basics');
  const [profile, setProfile] = useState<UserProfile>(user);
  const [newUnit, setNewUnit] = useState('');
  const [showToast, setShowToast] = useState(false);
  const invoices = useMemo(() => StorageService.getInvoices(), []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleSave = () => {
    onSave(profile);
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
          <p className="text-slate-500 font-medium text-sm">Manage your firm details for professional billing.</p>
        </div>
        <button onClick={handleSave} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">SAVE CHANGES</button>
      </div>

      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-x-auto no-scrollbar">
        <div className="flex min-w-full sm:min-w-0">
          {[
            { id: 'basics', label: 'Identity' },
            { id: 'billing', label: 'Bank & GST' },
            { id: 'units', label: 'Custom Units' },
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
                <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div className="md:col-span-2 pt-4 border-t border-slate-100">
                <label className="block text-xs font-black text-indigo-600 uppercase mb-2 tracking-widest">Terms & Conditions (Visible on Invoices)</label>
                <textarea 
                  value={profile.termsAndConditions} 
                  onChange={e => setProfile({...profile, termsAndConditions: e.target.value})} 
                  rows={4} 
                  className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl font-bold text-sm focus:border-indigo-400 focus:bg-white transition-all outline-none" 
                  placeholder="e.g. 1. Goods once sold will not be taken back..."
                />
                <p className="mt-2 text-[10px] text-slate-400 italic">This text will appear at the bottom of every invoice you print.</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'billing' && (
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xs font-black text-indigo-600 uppercase mb-4 tracking-widest">Tax Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Firm GSTIN</label>
                  <input type="text" value={profile.gstin} onChange={e => setProfile({...profile, gstin: e.target.value.toUpperCase()})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" placeholder="27XXXX..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">PAN Number</label>
                  <input type="text" value={profile.pan} onChange={e => setProfile({...profile, pan: e.target.value.toUpperCase()})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" placeholder="ABCDE1234F" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-indigo-600 uppercase mb-4 tracking-widest">Bank Details (For Payments)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Bank Name</label>
                  <input type="text" value={profile.bankName} onChange={e => setProfile({...profile, bankName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Account Number</label>
                  <input type="text" value={profile.accountNumber} onChange={e => setProfile({...profile, accountNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">IFSC Code</label>
                  <input type="text" value={profile.ifscCode} onChange={e => setProfile({...profile, ifscCode: e.target.value.toUpperCase()})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">UPI ID</label>
                  <input type="text" value={profile.upiId} onChange={e => setProfile({...profile, upiId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="name@upi" />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'units' && (activeTab === 'units' && (
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-300">
            <h3 className="text-xs font-black text-indigo-600 uppercase mb-4 tracking-widest">Billing Units</h3>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input type="text" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="e.g. sqft, ton" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              <button onClick={addUnit} className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-black rounded-xl active:scale-95 transition-all">ADD</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.availableUnits.map(unit => (
                <span key={unit} className="px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-600 border border-slate-200">{unit}</span>
              ))}
            </div>
          </section>
        ))}

        {activeTab === 'data' && (
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-black text-red-600 mb-2">Danger Zone</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">This will permanently delete all your invoice history and client list.</p>
              <button onClick={() => { if(confirm('Permanently delete all data?')) StorageService.clearAccountData(); window.location.reload(); }} className="w-full sm:w-auto px-8 py-4 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black text-sm hover:bg-red-600 hover:text-white transition-all">
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
