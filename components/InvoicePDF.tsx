
import React from 'react';
import { Invoice, UserProfile } from '../types';
import { formatCurrency, numberToWords } from '../services/formatters';

interface InvoicePDFProps {
  invoice: Invoice;
  user: UserProfile;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, user }) => {
  return (
    <div className="print-only p-12 bg-white text-black leading-tight w-full max-w-[210mm] mx-auto min-h-[297mm] relative" id="invoice-pdf">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-0.5 tracking-tight">{user.businessName}</h1>
          <p className="text-sm font-medium text-slate-700">{user.address}</p>
          <div className="flex items-center gap-4 text-xs text-slate-600 mt-2">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {user.phone}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {user.email}
            </span>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-wider">INVOICE</h2>
        </div>
      </div>

      {/* Bill To & Invoice Meta */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">BILL TO</h3>
          <p className="text-sm font-bold text-slate-800 leading-tight">{invoice.customerName}</p>
          <p className="text-sm text-slate-700 whitespace-pre-line max-w-[250px]">{invoice.customerAddress}</p>
          {invoice.customerPhone && (
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-700">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {invoice.customerPhone}
            </div>
          )}
        </div>
        <div className="text-right space-y-1.5 text-sm">
          <div className="flex justify-end gap-10">
            <span className="font-bold text-slate-900">Invoice#</span>
            <span className="text-slate-700 font-medium min-w-[80px]">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-end gap-10">
            <span className="font-bold text-slate-900">Invoice Date:</span>
            <span className="text-slate-700 font-medium min-w-[80px]">{new Date(invoice.date).toLocaleDateString('en-GB')}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-t border-b border-slate-400 mb-4">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="py-2 px-2 text-left text-[11px] font-bold text-slate-800 w-10">#</th>
            <th className="py-2 px-3 text-left text-[11px] font-bold text-slate-800">DESCRIPTION</th>
            <th className="py-2 px-2 text-center text-[11px] font-bold text-slate-800 w-24">QTY</th>
            <th className="py-2 px-3 text-right text-[11px] font-bold text-slate-800 w-32">PRICE</th>
            <th className="py-2 px-3 text-right text-[11px] font-bold text-slate-800 w-32">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((item, index) => (
            <tr key={item.id}>
              <td className="py-4 px-2 text-sm text-slate-800 align-top">{index + 1}</td>
              <td className="py-4 px-3 text-sm font-bold text-slate-900 align-top">{item.name}</td>
              <td className="py-4 px-2 text-center text-sm text-slate-800 align-top">
                <div className="font-bold">{item.quantity}</div>
                <div className="text-[10px] text-slate-500 font-medium">{item.unit || 'unit'}</div>
              </td>
              <td className="py-4 px-3 text-right text-sm text-slate-800 align-top">
                {item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-3 text-right text-sm font-bold text-slate-900 align-top">
                {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Totals */}
      <div className="flex justify-between items-start mb-12">
        <div className="max-w-[340px]">
          <h4 className="text-[11px] font-bold text-slate-900 mb-1 tracking-tight">AMOUNT IN WORDS:</h4>
          <p className="text-[12px] font-medium leading-snug text-slate-800">
            {numberToWords(invoice.grandTotal)}
          </p>
        </div>
        <div className="w-full max-w-[300px]">
          <div className="bg-slate-100 border border-slate-300 flex items-center justify-between px-4 py-3">
            <span className="text-xs font-bold text-slate-900">GRAND TOTAL</span>
            <span className="text-base font-bold text-slate-900">₹{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-16">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900 uppercase">For, {user.businessName.toUpperCase()}</p>
        </div>
        <div className="mt-20 flex justify-end">
          <div className="text-center w-56 border-t border-transparent pt-1">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">AUTHORIZED SIGNATURE</p>
          </div>
        </div>
      </div>

      {/* Page Numbering */}
      <div className="absolute bottom-8 right-12 text-slate-400 text-[10px] font-medium">
        Page 1 of 1
      </div>
    </div>
  );
};

export default InvoicePDF;
