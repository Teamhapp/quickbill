
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';

interface CustomerMasterProps {
  customers: Customer[];
  onSave: (customers: Customer[]) => void;
}

const CustomerMaster: React.FC<CustomerMasterProps> = ({ customers, onSave }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Reverted taxId to gstin to match the Customer interface in types.ts
  const [form, setForm] = useState<Partial<Customer>>({
    name: '', address: '', gstin: '', phone: ''
  });

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q)) || 
      // Reverted taxId to gstin
      (c.gstin && c.gstin.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const handleAdd = () => {
    if (!form.name || !form.address) return;
    const c: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: form.name!.trim(),
      address: form.address!.trim(),
      // Reverted taxId to gstin
      gstin: form.gstin?.trim()?.toUpperCase(),
      phone: form.phone?.trim()
    };
    onSave([...customers, c]);
    // Reverted taxId to gstin
    setForm({ name: '', address: '', gstin: '', phone: '' });
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editingId || !form.name) return;
    const updated = customers.map(c => 
      c.id === editingId ? { ...c, ...form } as Customer : c
    );
    onSave(updated);
    setEditingId(null);
    // Reverted taxId to gstin
    setForm({ name: '', address: '', gstin: '', phone: '' });
  };

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm(c);
    setIsAdding(false);
  };

  const removeCustomer = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      onSave(customers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Customer Master</h2>
          <p className="text-slate-500 font-medium">Manage regular clients for repeatable billing.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none font-bold shadow-sm"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          {!isAdding && !editingId && (
            <button 
              onClick={() => setIsAdding(true)}
              className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              NEW CUSTOMER
            </button>
          )}
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-8 rounded-[2rem] border-2 border-indigo-100 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <h3 className="font-black mb-8 text-sm uppercase text-indigo-500 tracking-[0.2em] flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">{editingId ? '✏️' : '👤'}</span>
            {editingId ? 'Edit Customer Profile' : 'New Customer Profile'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Customer / Firm Name</label>
              <input 
                type="text" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none font-bold text-lg"
                placeholder="e.g. Atlas Builders"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Phone Number</label>
              <input 
                type="text" 
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none font-bold text-lg"
                placeholder="98765..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">GSTIN (Optional)</label>
              <input 
                type="text" 
                // Reverted taxId to gstin
                value={form.gstin}
                // Reverted taxId to gstin
                onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})}
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none font-mono font-bold text-lg uppercase"
                placeholder="29ABC..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Full Address</label>
              <textarea 
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none font-bold text-lg h-24 resize-none"
                placeholder="Area, City, State, PIN..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-12 border-t border-slate-50 pt-8">
            <button 
                onClick={() => { setIsAdding(false); setEditingId(null); }} 
                className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-2xl"
            >
                Cancel
            </button>
            <button 
                onClick={editingId ? handleUpdate : handleAdd} 
                className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all"
            >
                {editingId ? 'UPDATE PROFILE' : 'SAVE CUSTOMER'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
              <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
              <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Status</th>
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="py-6 px-8">
                    <div className="font-black text-slate-900 text-lg leading-tight">{c.name}</div>
                    <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest truncate max-w-xs">{c.address}</div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="font-black text-slate-700 text-sm">{c.phone || '—'}</div>
                  </td>
                  <td className="py-6 px-6">
                    {/* Reverted taxId to gstin */}
                    {c.gstin ? (
                        <span className="text-[10px] font-black bg-indigo-50 px-3 py-1.5 rounded-lg uppercase text-indigo-600 border border-indigo-100">GST: {c.gstin}</span>
                    ) : (
                        <span className="text-[10px] font-black bg-slate-50 px-3 py-1.5 rounded-lg uppercase text-slate-400 border border-slate-100">Retail Client</span>
                    )}
                  </td>
                  <td className="py-6 px-8 text-right space-x-2">
                    <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-indigo-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => removeCustomer(c.id)} className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-32 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <p className="font-black text-lg italic">No customers found.</p>
                    <button onClick={() => setIsAdding(true)} className="mt-4 text-indigo-600 font-bold hover:underline tracking-widest uppercase text-xs">Register First Client</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerMaster;
