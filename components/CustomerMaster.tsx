
import React, { useState } from 'react';
import { Customer } from '../types';

interface CustomerMasterProps {
  customers: Customer[];
  onSave: (customers: Customer[]) => void;
}

const CustomerMaster: React.FC<CustomerMasterProps> = ({ customers, onSave }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '', address: '', gstin: '', phone: ''
  });

  const handleAdd = () => {
    if (!newCustomer.name || !newCustomer.address) return;
    const c: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCustomer.name!,
      address: newCustomer.address!,
      gstin: newCustomer.gstin,
      phone: newCustomer.phone
    };
    const updated = [...customers, c];
    onSave(updated);
    setNewCustomer({ name: '', address: '', gstin: '', phone: '' });
    setIsAdding(false);
  };

  const removeCustomer = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      onSave(customers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Customer Master</h2>
          <p className="text-gray-500">Speed up billing by saving your regular clients</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all"
          >
            + New Customer
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold mb-4 uppercase text-xs text-indigo-500 tracking-wider">Add New Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Customer / Firm Name</label>
              <input 
                type="text" 
                value={newCustomer.name}
                onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Atlas Builders"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
              <input 
                type="text" 
                value={newCustomer.phone}
                onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">GSTIN (Optional)</label>
              <input 
                type="text" 
                value={newCustomer.gstin}
                onChange={e => setNewCustomer({...newCustomer, gstin: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="29ABCDE..."
              />
            </div>
            <div className="md:col-span-1">
               {/* Spacer or additional fields */}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Address</label>
              <textarea 
                value={newCustomer.address}
                onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                placeholder="Shop No, Area, City, PIN"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md"
            >
              Save Customer
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Customer Name</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Contact</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">GSTIN</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length > 0 ? (
              customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-gray-800">{c.name}</div>
                    <div className="text-xs text-gray-400 truncate max-w-xs">{c.address}</div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {c.phone || '-'}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-mono text-xs">{c.gstin || '-'}</td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => removeCustomer(c.id)}
                      className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-16 text-center text-gray-400 italic">
                  No customers saved yet. They are auto-saved when you create a new invoice!
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
