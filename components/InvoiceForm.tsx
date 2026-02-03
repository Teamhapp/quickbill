
import React, { useState, useEffect, useRef } from 'react';
import { Product, InvoiceItem, Invoice, UserProfile, Customer } from '../types';
import { StorageService } from '../services/storage';
import { formatCurrency } from '../services/formatters';

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  user: UserProfile;
  products: Product[];
  customers: Customer[];
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, user, products, customers }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(StorageService.getNextInvoiceNumber());
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [taxEnabled, setTaxEnabled] = useState(user.taxEnabled);
  
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const productInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lastInvoice = StorageService.getLastInvoice();
    if (lastInvoice) {
      setCustomerName(lastInvoice.customerName);
      setCustomerAddress(lastInvoice.customerAddress);
      setCustomerGstin(lastInvoice.customerGstin || '');
      setCustomerPhone(lastInvoice.customerPhone || '');
      setTaxEnabled(lastInvoice.taxEnabled ?? user.taxEnabled);
      setItems(lastInvoice.items.map(item => ({ 
        ...item, 
        id: Math.random().toString(36).substring(2, 11) 
      })));
    }
  }, []);

  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [items, customerName, customerGstin, taxEnabled]);

  useEffect(() => {
    if (customerName.trim() && !showProductDropdown) {
      const query = customerName.toLowerCase();
      const scored = customers.filter(c => 
        c.name.toLowerCase().includes(query) || 
        (c.phone && c.phone.includes(query))
      );
      setCustomerResults(scored.slice(0, 5));
      setShowCustomerDropdown(scored.length > 0);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [customerName, customers, showProductDropdown]);

  useEffect(() => {
    if (productSearch.trim()) {
      const query = productSearch.toLowerCase();
      const scored = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.hsnCode && p.hsnCode.includes(query))
      );
      setProductResults(scored.slice(0, 10));
      setShowProductDropdown(true);
    } else {
      setShowProductDropdown(false);
    }
  }, [productSearch, products]);

  const handleCustomerSelect = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerAddress(c.address);
    setCustomerPhone(c.phone || '');
    setCustomerGstin(c.gstin || '');
    setShowCustomerDropdown(false);
    if (c.gstin) setTaxEnabled(true);
    setTimeout(() => productInputRef.current?.focus(), 50);
  };

  const addItem = (product: Product) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      updateItem(existing.id, 'quantity', existing.quantity + 1);
    } else {
      const newItem: InvoiceItem = {
        id: Math.random().toString(36).substring(2, 11),
        productId: product.id,
        name: product.name,
        hsnCode: product.hsnCode,
        quantity: 1,
        price: product.price,
        unit: product.unit,
        taxRate: product.taxRate,
        total: calculateItemTotal(product.price, 1, product.taxRate)
      };
      setItems([...items, newItem]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const addCustomItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substring(2, 11),
      productId: 'custom-' + Date.now(),
      name: productSearch,
      quantity: 1,
      price: 0,
      unit: 'pcs',
      taxRate: user.defaultTaxRate,
      total: 0
    };
    setItems([...items, newItem]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const calculateItemTotal = (price: number, quantity: number, itemTaxRate: number) => {
    const qty = Number(quantity) || 0;
    const prc = Number(price) || 0;
    if (!taxEnabled) return prc * qty;
    if (user.isTaxInclusive) return prc * qty;
    const sub = prc * qty;
    return sub + (sub * (itemTaxRate / 100));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = calculateItemTotal(updated.price, updated.quantity, updated.taxRate);
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!customerName.trim()) newErrors.customerName = 'Required';
    if (items.length === 0) newErrors.items = 'Add items';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let subTotal = 0;
    let totalTax = 0;

    items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const prc = Number(item.price) || 0;
      if (!taxEnabled) {
        subTotal += item.total;
      } else if (user.isTaxInclusive) {
        const itemTotal = prc * qty;
        const taxAmount = itemTotal - (itemTotal / (1 + item.taxRate / 100));
        totalTax += taxAmount;
        subTotal += (itemTotal - taxAmount);
      } else {
        const itemSub = prc * qty;
        const itemTax = itemSub * (item.taxRate / 100);
        subTotal += itemSub;
        totalTax += itemTax;
      }
    });

    const invoice: Invoice = {
      id: Math.random().toString(36).substring(2, 11),
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      customerName: customerName.trim(),
      customerAddress,
      customerGstin: customerGstin || undefined,
      customerPhone: customerPhone || undefined,
      items: items.map(i => ({ ...i, taxRate: taxEnabled ? i.taxRate : 0 })),
      subTotal,
      totalTax,
      grandTotal: subTotal + totalTax,
      status: 'Paid',
      createdAt: Date.now(),
      taxEnabled: taxEnabled,
      currencySymbol: user.currencySymbol
    };
    
    onSave(invoice);
    setInvoiceNumber(StorageService.getNextInvoiceNumber());
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
      <div className="p-6 md:p-8 space-y-8">
        {/* Type Toggle & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-8">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900">Rapid Billing</h2>
            <p className="text-slate-500 text-sm font-medium">India's fastest GST invoice maker.</p>
          </div>
          
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setTaxEnabled(false)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${!taxEnabled ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              ESTIMATE / CASH BILL
            </button>
            <button 
              onClick={() => setTaxEnabled(true)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${taxEnabled ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}
            >
              GST INVOICE
            </button>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Inv No.</span>
            <p className="font-mono text-xl font-black text-indigo-600">{invoiceNumber}</p>
          </div>
        </div>

        {/* Client Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Customer Name</label>
            <input 
              type="text" 
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Search or Type..."
              className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl outline-none font-bold ${errors.customerName ? 'border-red-400' : 'border-slate-100 focus:border-indigo-400'}`}
            />
            {showCustomerDropdown && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                {customerResults.map(c => (
                  <button key={c.id} onClick={() => handleCustomerSelect(c)} className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-slate-50 last:border-0">
                    <p className="font-black text-sm">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Mobile Number</label>
            <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="10 Digits..." className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Customer GSTIN</label>
            <input type="text" value={customerGstin} onChange={e => setCustomerGstin(e.target.value.toUpperCase())} placeholder="27XXXXX..." className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-mono font-bold uppercase" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Billing Address</label>
            <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="City, State..." className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold" />
          </div>
        </div>

        {/* Product Search */}
        <div className="relative">
          <input 
            ref={productInputRef}
            type="text" 
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (productResults[0]) addItem(productResults[0]);
                else if (productSearch.trim()) addCustomItem();
              }
            }}
            placeholder="🔍 Type Product Name or HSN..."
            className="w-full px-6 py-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl outline-none text-xl font-black text-indigo-900 placeholder:text-indigo-200"
          />
          {showProductDropdown && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
              {productResults.map(p => (
                <button key={p.id} onClick={() => addItem(p)} className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-indigo-50 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-black text-lg">{p.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">HSN: {p.hsnCode || '—'}</p>
                  </div>
                  <p className="font-black text-lg text-indigo-600">₹{p.price}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="bg-slate-50 rounded-3xl p-4 overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="pb-4 px-2 w-10">#</th>
                <th className="pb-4 px-2">Item Name / HSN</th>
                <th className="pb-4 px-2 w-24 text-center">Qty</th>
                <th className="pb-4 px-2 w-32 text-center">Price</th>
                {taxEnabled && <th className="pb-4 px-2 w-28 text-center">GST %</th>}
                <th className="pb-4 px-4 w-36 text-right">Total</th>
                <th className="pb-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-white group transition-all">
                  <td className="py-4 px-2 text-xs font-black text-slate-300">{idx + 1}</td>
                  <td className="py-4 px-2">
                    <p className="font-black text-slate-800">{item.name}</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] font-black uppercase text-indigo-400">HSN: {item.hsnCode || '—'}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400">Unit: {item.unit}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg font-black text-center" />
                  </td>
                  <td className="py-4 px-2">
                    <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg font-black text-center" />
                  </td>
                  {taxEnabled && (
                    <td className="py-4 px-2">
                      <select value={item.taxRate} onChange={e => updateItem(item.id, 'taxRate', Number(e.target.value))} className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg font-black text-center text-sm">
                        {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </td>
                  )}
                  <td className="py-4 px-4 text-right font-black text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Sums */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 pt-4">
          <div className="flex-1 text-slate-400 text-xs italic font-medium">
             Muscle Memory Mode: Last invoice auto-loaded. Just change Quantity and Save.
          </div>

          <div className="w-full md:w-80 space-y-3">
             <div className="space-y-1.5 px-2">
               <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                 <span>Subtotal</span>
                 <span className="text-slate-600">{formatCurrency(items.reduce((s,i)=>s+(i.total - (taxEnabled ? (user.isTaxInclusive ? (i.total - (i.total/(1+i.taxRate/100))) : (i.price*i.quantity*i.taxRate/100)) : 0)),0))}</span>
               </div>
               {taxEnabled && (
                 <div className="flex justify-between text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                   <span>GST Total</span>
                   <span className="text-indigo-600">{formatCurrency(items.reduce((s,i)=>s+(user.isTaxInclusive ? (i.total - (i.total/(1+i.taxRate/100))) : (i.price*i.quantity*i.taxRate/100)), 0))}</span>
                 </div>
               )}
             </div>
             
             <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-2xl shadow-xl">
               <span className="font-black uppercase tracking-widest text-[9px]">Grand Total</span>
               <span className="text-3xl font-black">{formatCurrency(items.reduce((s,i)=>s+i.total,0))}</span>
             </div>

             <button onClick={handleSave} className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all border-b-4 border-indigo-800">
              SAVE & PRINT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
