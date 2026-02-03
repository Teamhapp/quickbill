
import React, { useState, useMemo } from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../services/formatters';

interface HistoryViewProps {
  invoices: Invoice[];
  onPreview: (invoice: Invoice) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ invoices, onPreview }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerPhone && inv.customerPhone.includes(q));

      const invDate = inv.date; // 'YYYY-MM-DD'
      const matchesDate = (!startDate || invDate >= startDate) && 
                          (!endDate || invDate <= endDate);

      return matchesSearch && matchesDate;
    });
  }, [invoices, searchQuery, startDate, endDate]);

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const exportToExcel = () => {
    if (filteredInvoices.length === 0) return;

    // CSV Headers - Designed for Indian Accounting/Excel
    const headers = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Customer GSTIN',
      'Customer Phone',
      'Taxable Value (Subtotal)',
      'GST Amount',
      'Grand Total',
      'Tax Enabled',
      'Status'
    ];

    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.date,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      inv.customerGstin || 'N/A',
      inv.customerPhone || 'N/A',
      inv.subTotal.toFixed(2),
      inv.totalTax.toFixed(2),
      inv.grandTotal.toFixed(2),
      inv.taxEnabled ? 'YES' : 'NO',
      inv.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = `QuickBill_Report_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Billing History</h2>
          <p className="text-slate-500 font-medium">Manage and track your issued professional invoices.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {filteredInvoices.length > 0 && (
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export XLS (CSV)
            </button>
          )}

          {(searchQuery || startDate || endDate) && (
            <button 
              onClick={clearFilters}
              className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors px-2 py-2"
            >
              Reset Filters
            </button>
          )}
          
          <div className="relative flex-1 min-w-[240px] lg:w-80">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, Phone, or ID..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none font-bold shadow-sm transition-all"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-slate-100/50 border border-slate-200 p-4 rounded-3xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">From Date</span>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">To Date</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice Details</th>
                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Info</th>
                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Tax Collected</th>
                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Grand Total</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="py-6 px-8">
                      <div className="font-black text-indigo-600 text-lg mb-0.5">{inv.invoiceNumber}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {new Date(inv.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${inv.taxEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                          {inv.taxEnabled ? 'Tax Invoice' : 'Simple Receipt'}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="font-black text-slate-800">{inv.customerName}</div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                        {inv.customerPhone || 'No Phone Number'}
                      </div>
                    </td>
                    <td className="py-6 px-6 text-right">
                      <div className="text-sm font-bold text-slate-400 italic">
                        {inv.taxEnabled ? formatCurrency(inv.totalTax, inv.currencySymbol) : '—'}
                      </div>
                    </td>
                    <td className="py-6 px-6 text-right">
                      <div className="text-xl font-black text-slate-900">{formatCurrency(inv.grandTotal, inv.currencySymbol)}</div>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <button 
                        onClick={() => onPreview(inv)}
                        className="inline-flex items-center px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 group-hover:border-indigo-600"
                      >
                        REPRINT / VIEW
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <p className="text-slate-400 font-black text-lg">No matching invoices found.</p>
                      <p className="text-slate-300 font-bold text-sm">Adjust your search or date filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
