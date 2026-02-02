
import React from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../services/formatters';

interface HistoryViewProps {
  invoices: Invoice[];
  onPreview: (invoice: Invoice) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ invoices, onPreview }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Billing History</h2>
          <p className="text-gray-500">View and reprint past invoices</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Inv #</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="py-4 px-6 text-gray-600">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-800">{inv.customerName}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[150px]">{inv.customerAddress}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {inv.customerPhone || '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900">{formatCurrency(inv.grandTotal)}</td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => onPreview(inv)}
                        className="inline-flex items-center px-3 py-1 bg-white border border-indigo-200 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    No invoices found. Create your first one!
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
