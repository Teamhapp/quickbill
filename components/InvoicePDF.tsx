
import React from 'react';
import { Invoice, UserProfile } from '../types';
import { formatCurrency, numberToWords } from '../services/formatters';

interface InvoicePDFProps {
  invoice: Invoice;
  user: UserProfile;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, user }) => {
  const isTaxInvoice = invoice.taxEnabled;
  const currencySymbol = invoice.currencySymbol || '₹';

  return (
    <div className="print-only p-8 bg-white text-black leading-tight w-full max-w-[210mm] mx-auto relative font-sans text-xs" id="invoice-pdf">
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{user.businessName}</h1>
          <div className="space-y-1 font-semibold text-slate-700 max-w-sm">
            <p className="whitespace-pre-wrap leading-relaxed">{user.address}</p>
            <div className="pt-2 grid grid-cols-1 gap-0.5">
              <p><span className="text-slate-400 font-black text-[8px] uppercase tracking-wider">Mobile:</span> {user.phone}</p>
              <p><span className="text-slate-400 font-black text-[8px] uppercase tracking-wider">Email:</span> {user.email}</p>
              {user.gstin && <p className="text-slate-900 font-black border-t border-slate-100 mt-1 pt-1">GSTIN: {user.gstin}</p>}
              {user.pan && <p className="text-slate-900 font-bold">PAN: {user.pan}</p>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-lg inline-block mb-4">
            <h2 className="text-lg font-black tracking-widest uppercase">
              {isTaxInvoice ? 'Tax Invoice' : 'Cash Bill'}
            </h2>
          </div>
          <div className="space-y-1.5 font-bold">
            <p className="flex justify-end items-center gap-2">
              <span className="text-slate-400 uppercase text-[9px] tracking-widest font-black">Invoice No:</span> 
              <span className="text-slate-900 font-black text-sm">{invoice.invoiceNumber}</span>
            </p>
            <p className="flex justify-end items-center gap-2">
              <span className="text-slate-400 uppercase text-[9px] tracking-widest font-black">Date:</span> 
              <span className="text-slate-900">{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bill To & Logistics Section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/30">
          <h3 className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest flex items-center gap-2">
            <span className="w-1 h-3 bg-indigo-500 rounded-full"></span> Details of Receiver (Billed To)
          </h3>
          <p className="font-black text-slate-900 text-sm mb-1">{invoice.customerName}</p>
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-3">{invoice.customerAddress || 'Address not provided'}</p>
          <div className="grid grid-cols-1 gap-1 border-t border-slate-100 pt-3">
            {invoice.customerPhone && (
              <p className="flex items-center gap-2">
                <span className="text-slate-400 font-black uppercase text-[8px] tracking-widest w-16">Contact:</span> 
                <span className="text-slate-800 font-bold">{invoice.customerPhone}</span>
              </p>
            )}
            {invoice.customerGstin && (
              <p className="flex items-center gap-2">
                <span className="text-slate-400 font-black uppercase text-[8px] tracking-widest w-16">GSTIN:</span> 
                <span className="text-slate-900 font-black">{invoice.customerGstin}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-end items-end space-y-4">
          {user.upiId && (
            <div className="text-right p-3 border-2 border-slate-50 rounded-2xl bg-white shadow-sm">
               <p className="text-[8px] font-black uppercase text-indigo-400 mb-1 tracking-[0.2em]">UPI Payment ID</p>
               <p className="font-black text-indigo-600 text-xs">{user.upiId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Items Table */}
      <div className="mb-8 border border-slate-900 rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.15em]">
              <th className="py-3 px-2 text-left w-10 border-r border-slate-700">Sr.</th>
              <th className="py-3 px-3 text-left border-r border-slate-700">Description of Goods / Services</th>
              <th className="py-3 px-2 text-center w-24 border-r border-slate-700">HSN/SAC</th>
              <th className="py-3 px-2 text-center w-16 border-r border-slate-700">Qty</th>
              <th className="py-3 px-2 text-right w-28 border-r border-slate-700">Rate ({currencySymbol})</th>
              {isTaxInvoice && <th className="py-3 px-2 text-center w-16 border-r border-slate-700">GST %</th>}
              <th className="py-3 px-3 text-right w-32 font-black">Amount ({currencySymbol})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((item, index) => {
              // Standard GST Taxable Value calculation
              const qty = Number(item.quantity) || 0;
              const rate = Number(item.price) || 0;
              const taxableValue = rate * qty;

              return (
                <tr key={item.id} className="font-bold text-slate-800">
                  <td className="py-3 px-2 align-top text-center text-slate-400 border-r border-slate-100">{index + 1}</td>
                  <td className="py-3 px-3 align-top border-r border-slate-100">
                    <div className="font-black text-slate-900">{item.name}</div>
                  </td>
                  <td className="py-3 px-2 text-center align-top text-slate-500 font-mono border-r border-slate-100">
                    {item.hsnCode || '—'}
                  </td>
                  <td className="py-3 px-2 text-center align-top border-r border-slate-100">
                    {item.quantity} <span className="text-[8px] font-black uppercase text-slate-400 ml-0.5">{item.unit}</span>
                  </td>
                  <td className="py-3 px-2 text-right align-top border-r border-slate-100">
                    {rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  {isTaxInvoice && (
                    <td className="py-3 px-2 text-center align-top text-indigo-600 font-black border-r border-slate-100">
                      {item.taxRate}%
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-black align-top bg-slate-50/50">
                    {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
            
            {/* Consistent Empty Rows for Layout Stability */}
            {[...Array(Math.max(0, 10 - invoice.items.length))].map((_, i) => (
              <tr key={'empty-'+i} className="h-9 border-t border-slate-50">
                <td className="border-r border-slate-100"></td>
                <td className="border-r border-slate-100"></td>
                <td className="border-r border-slate-100"></td>
                <td className="border-r border-slate-100"></td>
                <td className="border-r border-slate-100"></td>
                {isTaxInvoice && <td className="border-r border-slate-100"></td>}
                <td className="bg-slate-50/30"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="flex justify-between items-start gap-10">
        <div className="flex-1">
          <div className="mb-6">
            <h4 className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-[0.2em]">Total Amount (in Words)</h4>
            <p className="font-black text-slate-900 text-xs italic border-l-4 border-slate-900 pl-3 leading-relaxed">
              {currencySymbol === '₹' ? 'Rupees' : 'INR'} {numberToWords(invoice.grandTotal)}
            </p>
          </div>
          
          {user.bankName && (
            <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-6">
              <div className="flex gap-6">
                <div>
                  <h4 className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">Bank Details</h4>
                  <p className="font-black text-slate-900 text-xs">{user.bankName}</p>
                  <div className="mt-1 space-y-0.5 text-[9px] font-bold text-slate-600">
                    <p><span className="text-slate-400 uppercase tracking-tighter mr-2">A/c Holder:</span> {user.accountName || user.businessName}</p>
                    <p><span className="text-slate-400 uppercase tracking-tighter mr-2">Account No:</span> <span className="text-slate-900">{user.accountNumber}</span></p>
                    <p><span className="text-slate-400 uppercase tracking-tighter mr-2">IFSC Code:</span> <span className="text-slate-900">{user.ifscCode}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-[280px]">
          <div className="border border-slate-900 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 space-y-2.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Taxable Value:</span>
                <span className="text-slate-900">{formatCurrency(invoice.subTotal, currencySymbol)}</span>
              </div>
              
              {isTaxInvoice && (
                <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-2 border-b border-slate-100">
                  <span className="flex items-center gap-1">Total GST Collected:</span>
                  <span className="text-indigo-600 font-black">{formatCurrency(invoice.totalTax, currencySymbol)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Grand Total</span>
                <span className="text-2xl font-black text-slate-900">{formatCurrency(invoice.grandTotal, currencySymbol)}</span>
              </div>
            </div>
            
            <div className="bg-slate-900 text-white text-center py-2 px-4 text-[9px] font-black uppercase tracking-widest">
              Final Payable Amount
            </div>
          </div>
        </div>
      </div>

      {/* Signature & T&C */}
      <div className="mt-16 pt-8 border-t border-slate-200">
        <div className="flex justify-between items-end">
          <div className="max-w-sm">
            <h4 className="text-[9px] font-black uppercase text-slate-900 mb-2 tracking-widest">Terms & Conditions</h4>
            <div className="text-[9px] text-slate-500 leading-relaxed whitespace-pre-wrap italic">
              {user.termsAndConditions || '1. Goods once sold will not be taken back.\n2. All disputes are subject to local jurisdiction.'}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 mb-14 uppercase tracking-widest">Authorised Signatory</p>
            <div className="w-56 border-t-2 border-slate-900 pt-2">
              <p className="text-xs font-black text-slate-900 uppercase">{user.businessName}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Page Footer */}
      <div className="absolute bottom-8 left-8 right-8 text-center border-t border-slate-50 pt-4">
        <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.4em]">This is a Computer Generated Invoice — QuickBill India</p>
      </div>
    </div>
  );
};

export default InvoicePDF;
