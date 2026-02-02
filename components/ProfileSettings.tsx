
import React, { useState, useMemo } from 'react';
import { UserProfile, Invoice } from '../types';
import { StorageService } from '../services/storage';
import { formatCurrency } from '../services/formatters';

interface ProfileSettingsProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
}

type SettingsTab = 'basics' | 'billing' | 'bank' | 'reports' | 'data';

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onSave }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('basics');
  const [profile, setProfile] = useState<UserProfile>(user);
  const invoices = useMemo(() => StorageService.getInvoices(), []);

  const handleSave = () => {
    onSave(profile);
    alert('Settings Saved Successfully!');
  };

  const handleClearData = () => {
    if (confirm('DANGER: This will delete ALL your invoice history. Product and Customer masters will remain. Continue?')) {
      StorageService.clearAccountData();
      window.location.reload();
    }
  };

  const exportToCSV = () => {
    if (invoices.length === 0) return alert('No invoices to export');
    
    const headers = ['Invoice No', 'Date', 'Customer', 'GSTIN', 'Subtotal', 'Tax', 'Grand Total', 'Status'];
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.date,
      inv.customerName,
      inv.customerGSTIN || '',
      inv.subTotal,
      inv.totalGst,
      inv.grandTotal,
      inv.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `QuickBill_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalTax = invoices.reduce((sum, inv) => sum + inv.totalGst, 0);
    const count = invoices.length;
    const avgValue = count > 0 ? totalSales / count : 0;
    
    // Top customers
    const custMap: Record<string, number> = {};
    invoices.forEach(inv => {
      custMap[inv.customerName] = (custMap[inv.customerName] || 0) + inv.grandTotal;
    });
    const topCustomer = Object.entries(custMap).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { totalSales, totalTax, count, avgValue, topCustomer };
  }, [invoices]);

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'basics', label: 'Basics', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'billing', label: 'Billing & GST', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'bank', label: 'Bank & Terms', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'data', label: 'Data', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Settings & Workspace</h2>
          <p className="text-slate-500 font-medium">Control your identity, taxes, and data export</p>
        </div>
        {activeTab !== 'reports' && activeTab !== 'data' && (
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
          >
            SAVE CHANGES
          </button>
        )}
      </div>

      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Basics Tab */}
        {activeTab === 'basics' && (
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-6">Business Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Legal Business Name</label>
                  <input 
                    type="text" 
                    value={profile.businessName}
                    onChange={e => setProfile({...profile, businessName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Proprietor / Owner Name</label>
                  <input 
                    type="text" 
                    value={profile.ownerName || ''}
                    onChange={e => setProfile({...profile, ownerName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={profile.phone}
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Business Address</label>
                  <textarea 
                    value={profile.address}
                    onChange={e => setProfile({...profile, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Logo URL</label>
                  <input 
                    type="text" 
                    value={profile.logoUrl || ''}
                    onChange={e => setProfile({...profile, logoUrl: e.target.value})}
                    placeholder="https://i.ibb.co/..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-6">Tax & Invoice Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">GSTIN Number</label>
                  <input 
                    type="text" 
                    value={profile.gstin}
                    onChange={e => setProfile({...profile, gstin: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold"
                    placeholder="29ABCDE1234F1Z5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Business PAN</label>
                  <input 
                    type="text" 
                    value={profile.pan || ''}
                    onChange={e => setProfile({...profile, pan: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold"
                    placeholder="ABCDE1234F"
                  />
                </div>
                
                <div className="md:col-span-2 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="font-black text-indigo-900">GST Compliance Mode</p>
                      <p className="text-xs text-indigo-600 font-bold uppercase tracking-tight">Required for B2B billing</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={profile.gstEnabled}
                      onChange={e => setProfile({...profile, gstEnabled: e.target.checked})}
                    />
                    <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                  </label>
                </div>

                {profile.gstEnabled && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Default GST Rate (%)</label>
                      <select 
                        value={profile.defaultGstRate}
                        onChange={e => setProfile({...profile, defaultGstRate: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      >
                        {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Calculation Base</label>
                      <select 
                        value={profile.isGstInclusive ? 'inclusive' : 'exclusive'}
                        onChange={e => setProfile({...profile, isGstInclusive: e.target.value === 'inclusive'})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      >
                        <option value="exclusive">Tax Exclusive (Extra)</option>
                        <option value="inclusive">Tax Inclusive (MRP)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Bank & Terms Tab */}
        {activeTab === 'bank' && (
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-6">Payment & Footers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Bank Name</label>
                  <input 
                    type="text" 
                    value={profile.bankName || ''}
                    onChange={e => setProfile({...profile, bankName: e.target.value})}
                    placeholder="HDFC / SBI / AXIS"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">UPI ID (QR Support)</label>
                  <input 
                    type="text" 
                    value={profile.upiId || ''}
                    onChange={e => setProfile({...profile, upiId: e.target.value})}
                    placeholder="name@okaxis"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Account Number</label>
                  <input 
                    type="text" 
                    value={profile.accountNumber || ''}
                    onChange={e => setProfile({...profile, accountNumber: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">IFSC Code</label>
                  <input 
                    type="text" 
                    value={profile.ifscCode || ''}
                    onChange={e => setProfile({...profile, ifscCode: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Terms and Conditions</label>
                  <textarea 
                    value={profile.termsAndConditions || ''}
                    onChange={e => setProfile({...profile, termsAndConditions: e.target.value})}
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm italic"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-2">Total Sales Volume</p>
                <p className="text-4xl font-black">{formatCurrency(stats.totalSales)}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] font-black bg-indigo-500 px-2 py-1 rounded-lg">{stats.count} Bills Issued</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Tax Collected (GST)</p>
                <p className="text-4xl font-black text-slate-800">{formatCurrency(stats.totalTax)}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">Avg ₹{Math.round(stats.avgValue)} / bill</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Top Loyal Customer</p>
                <p className="text-2xl font-black text-indigo-600 truncate">{stats.topCustomer}</p>
                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">By total invoice value</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">Financial Reconciliation</h3>
                <p className="text-slate-500 text-sm font-medium">Export all your billing history to a CSV file for your CA or accounting software.</p>
              </div>
              <button 
                onClick={exportToCSV}
                className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                DOWNLOAD SALES REPORT
              </button>
            </div>
          </section>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-6">Workspace Management</h3>
              <div className="space-y-6">
                 <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                      <p className="font-black text-red-700">Clear Invoice History</p>
                      <p className="text-xs text-red-500 font-medium">Reset next invoice number to 1 and wipe all past billing records.</p>
                    </div>
                    <button 
                      onClick={handleClearData}
                      className="px-6 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                      RESET WORKSPACE
                    </button>
                 </div>

                 <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-800">Secure Browser Storage</p>
                      <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                        Your data is encrypted and stored locally in this browser. To sync across devices, a cloud subscription is required (Coming Soon).
                      </p>
                    </div>
                 </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
