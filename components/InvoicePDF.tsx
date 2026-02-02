
import React from 'react';
import { Invoice, UserProfile } from '../types';
import { formatCurrency, numberToWords } from '../services/formatters';

interface InvoicePDFProps {
  invoice: Invoice;
  user: UserProfile;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, user }) => {
  return (
    <div className="print-only p-12 bg-white text-black leading-tight w-full max-w-[210mm] mx-auto min-h-[297mm] relative font-sans" id="invoice-pdf">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-slate-900">{user.businessName}</h1>
          <p className="text-sm font-semibold">{user.ownerName}</p>
          <div className="flex items-center gap-3 text-[13px] text-slate-800 font-medium">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              +91 {user.phone}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {user.email}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-widest text-slate-900 uppercase">INVOICE</h2>
      </div>

      {/* Bill To & Details */}
      <div className="flex justify-between mb-10 items-start">
        <div className="max-w-xs">
          <h3 className="text-[13px] font-bold uppercase text-slate-900 mb-2">BILL TO</h3>
          <p className="text-[14px] font-bold">{invoice.customerName}</p>
          <p className="text-[13px] text-slate-700 leading-relaxed">{invoice.customerAddress}</p>
          <p className="text-[13px] text-slate-700 font-medium mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            +91{invoice.customerPhone}
          </p>
        </div>
        <div className="text-right space-y-1.5">
          <div className="flex justify-end gap-10">
            <span className="text-[13px] font-bold text-slate-900">Invoice#</span>
            <span className="text-[13px] min-w-[80px] text-right">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-end gap-10">
            <span className="text-[13px] font-bold text-slate-900">Invoice Date:</span>
            <span className="text-[13px] min-w-[80px] text-right">{new Date(invoice.date).toLocaleDateString('en-GB')}</span>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="bg-slate-50 border-t border-b border-slate-300 text-[12px] font-bold text-slate-900 uppercase">
            <th className="py-2.5 px-2 text-left w-10">#</th>
            <th className="py-2.5 px-2 text-left">DESCRIPTION</th>
            <th className="py-2.5 px-2 text-center w-24">QTY</th>
            <th className="py-2.5 px-2 text-right w-32">PRICE</th>
            <th className="py-2.5 px-2 text-right w-32">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {invoice.items.map((item, index) => (
            <tr key={item.id} className="text-[13px] font-medium text-slate-900">
              <td className="py-5 px-2 align-top">{index + 1}</td>
              <td className="py-5 px-2 align-top">
                <div className="font-bold">{item.name}</div>
              </td>
              <td className="py-5 px-2 text-center align-top">
                <div className="font-medium">{item.quantity}</div>
                <div className="text-[11px] text-slate-500 font-bold mt-0.5">{item.unit}</div>
              </td>
              <td className="py-5 px-2 text-right align-top">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="py-5 px-2 text-right font-bold align-top">₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Section */}
      <div className="flex justify-between items-start mt-8 pt-4 border-t border-slate-400">
        <div className="max-w-[320px]">
          <h4 className="text-[12px] font-bold uppercase text-slate-900 mb-1">AMOUNT IN WORDS:</h4>
          <p className="text-[13px] font-bold leading-snug">{numberToWords(invoice.grandTotal)}</p>
        </div>
        
        <div className="w-[350px] bg-slate-50 border border-slate-200 flex justify-between items-center px-6 py-4">
          <span className="text-[14px] font-black uppercase tracking-tight">GRAND TOTAL</span>
          <span className="text-[16px] font-black">₹{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-20 flex flex-col items-end text-right">
        <p className="text-[14px] font-bold mb-20">For, {user.businessName.toUpperCase()}</p>
        <p className="text-[11px] font-bold uppercase text-slate-400 border-t border-transparent inline-block tracking-widest">AUTHORIZED SIGNATURE</p>
      </div>

      {/* Page Marker */}
      <div className="absolute bottom-8 right-12 text-[11px] text-slate-400 font-medium">
        Page 1 of 1
      </div>
    </div>
  );
};

export default InvoicePDF;
