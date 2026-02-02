
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
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isMemoryLoaded, setIsMemoryLoaded] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const productRef = useRef<HTMLDivElement>(null);
  const customerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastInvoice = StorageService.getLastInvoice();
    if (lastInvoice) {
      setCustomerName(lastInvoice.customerName);
      setCustomerAddress(lastInvoice.customerAddress);
      setCustomerGSTIN(lastInvoice.customerGSTIN || '');
      setCustomerPhone(lastInvoice.customerPhone || '');
      setItems(lastInvoice.items.map(item => ({ 
        ...item, 
        id: Math.random().toString(36).substring(2, 11) 
      })));
      setIsMemoryLoaded(true);
      const timer = setTimeout(() => setIsMemoryLoaded(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Advanced Product Search with Fuzzy Sequence Matching
  useEffect(() => {
    if (productSearch.trim().length > 0) {
      const query = productSearch.toLowerCase().trim();
      
      const scoredResults = products.map(p => {
        const name = p.name.toLowerCase();
        const id = p.id.toLowerCase();
        let score = 0;

        // 1. Exact ID Match (Highest Priority)
        if (id === query) {
          score += 1000;
        } else if (id.startsWith(query)) {
          score += 500;
        } else if (id.includes(query)) {
          score += 200;
        }

        // 2. Name Prefix Match (Second Priority)
        if (name.startsWith(query)) {
          score += 400;
        } else if (name.includes(query)) {
          score += 150;
        }

        // 3. Fuzzy Sequence Match (Third Priority)
        // Checks if query characters exist in order within the name (e.g., "ms" -> "M Sand")
        let qIdx = 0;
        let nIdx = 0;
        let gaps = 0;
        while (qIdx < query.length && nIdx < name.length) {
          if (query[qIdx] === name[nIdx]) {
            qIdx++;
          } else {
            gaps++;
          }
          nIdx++;
        }
        
        if (qIdx === query.length) {
          // If query is "ms" and name is "M Sand", it's a fuzzy match
          // Reward fewer gaps
          score += Math.max(0, 100 - gaps);
        }

        return { product: p, score };
      });

      const filtered = scoredResults
        .filter(res => res.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(res => res.product);

      setProductResults(filtered.slice(0, 6));
      setShowProductDropdown(true);
    } else setShowProductDropdown(false);
  }, [productSearch, products]);

  useEffect(() => {
    if (customerSearch.trim().length > 0) {
      const filtered = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
      setCustomerResults(filtered.slice(0, 5));
      setShowCustomerDropdown(true);
    } else setShowCustomerDropdown(false);
  }, [customerSearch, customers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productRef.current && !productRef.current.contains(event.target as Node)) setShowProductDropdown(false);
      if (customerRef.current && !customerRef.current.contains(event.target as Node)) setShowCustomerDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerAddress(c.address);
    setCustomerGSTIN(c.gstin || '');
    setCustomerPhone(c.phone || '');
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    if (errors.customerName) setErrors({ ...errors, customerName: '' });
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
        quantity: 1,
        price: product.price,
        unit: product.unit,
        gstRate: product.gstRate,
        total: product.price
      };
      setItems([...items, newItem]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
    if (errors.items) setErrors({ ...errors, items: '' });
  };

  const addCustomItem = () => {
    if (!productSearch.trim()) return;
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substring(2, 11),
      productId: 'custom-' + Date.now(),
      name: productSearch.trim(),
      quantity: 1,
      price: 0,
      unit: 'unit',
      gstRate: 0,
      total: 0
    };
    setItems([...items, newItem]);
    setProductSearch('');
    setShowProductDropdown(false);
    if (errors.items) setErrors({ ...errors, items: '' });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = (updated.quantity || 0) * (updated.price || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const calculateTotals = () => {
    const subTotal = items.reduce((sum, i) => sum + i.total, 0);
    const totalGst = items.reduce((sum, i) => sum + (i.total * (i.gstRate / 100)), 0);
    return { subTotal, totalGst, grandTotal: subTotal + totalGst };
  };

  const totals = calculateTotals();

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (items.length === 0) newErrors.items = 'Please add at least one item';
    
    items.forEach((item, index) => {
      if (item.quantity <= 0) newErrors[`item-${index}-qty`] = 'Qty must be > 0';
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors({}), 3000);
      return;
    }
    
    const invoice: Invoice = {
      id: Math.random().toString(36).substring(2, 11),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      customerName: customerName.trim(),
      customerAddress,
      customerGSTIN: customerGSTIN || undefined,
      customerPhone: customerPhone || undefined,
      items,
      ...totals,
      status: 'Paid',
      createdAt: Date.now()
    };
    
    onSave(invoice);
    setProductSearch('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      {isMemoryLoaded && (
        <div className="absolute top-4 right-4 animate-bounce z-10">
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 shadow-sm">
            ⚡ Last Invoice Loaded
          </span>
        </div>
      )}

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">New Invoice</h2>
            <p className="text-gray-500 text-sm italic">Type and save — everything is auto-remembered</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold uppercase text-gray-400">Date</span>
            <p className="font-medium">{new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Customer Section */}
        <div className="space-y-4">
          <div className="relative" ref={customerRef}>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search Saved Customer</label>
            <input 
              type="text" 
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Start typing customer name..."
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50/10"
            />
            {showCustomerDropdown && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {customerResults.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex justify-between items-center border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <span className="font-bold block text-slate-800">{c.name}</span>
                      <span className="text-xs text-gray-500 truncate">{c.address}</span>
                    </div>
                    <span className="text-xs text-indigo-500 font-bold px-2 py-1 bg-indigo-50 rounded">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Customer Name</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) setErrors({...errors, customerName: ''});
                }}
                placeholder="Atlas Builders"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all font-semibold ${
                  errors.customerName ? 'border-red-500 bg-red-50 focus:ring-red-200 error-shake' : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
              {errors.customerName && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.customerName}</p>}
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
              <input 
                type="text" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Address / Details</label>
              <input 
                type="text" 
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Gem Nagar, Mylampatti"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">GSTIN (Optional)</label>
              <input 
                type="text" 
                value={customerGSTIN}
                onChange={(e) => setCustomerGSTIN(e.target.value.toUpperCase())}
                placeholder="29ABCDE..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Product Section */}
        <div className="relative" ref={productRef}>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Add Product (Smart ID & Fuzzy Search)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={productSearch}
              onKeyDown={(e) => e.key === 'Enter' && productResults.length === 0 && addCustomItem()}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search ID or Name (e.g. 'ms' for M-Sand)..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 outline-none bg-indigo-50/30 text-lg font-medium transition-all ${
                errors.items ? 'border-red-400 focus:ring-red-200' : 'border-indigo-200 focus:ring-indigo-500'
              }`}
            />
            {productSearch.trim().length > 0 && (
              <button 
                onClick={addCustomItem}
                className="bg-indigo-600 text-white px-4 rounded-lg font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                + Add New
              </button>
            )}
          </div>
          {errors.items && <p className="text-xs text-red-500 mt-1 font-bold">{errors.items}</p>}
          
          {showProductDropdown && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
              {productResults.length > 0 ? (
                productResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex justify-between items-center group border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold block text-indigo-900">{p.name}</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono font-bold">{p.id}</span>
                      </div>
                      <span className="text-xs text-gray-500 uppercase">{p.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-indigo-600">₹{p.price.toLocaleString('en-IN')}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 mb-2">"{productSearch}" not found in master.</p>
                  <button 
                    onClick={addCustomItem}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    + Click here to add as a new item
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-2 text-xs font-black text-gray-400 uppercase">#</th>
                <th className="py-3 px-2 text-xs font-black text-gray-400 uppercase">Description</th>
                <th className="py-3 px-2 text-xs font-black text-gray-400 uppercase w-24">Qty</th>
                <th className="py-3 px-2 text-xs font-black text-gray-400 uppercase w-32">Price (₹)</th>
                <th className="py-3 px-2 text-xs font-black text-gray-400 uppercase w-32 text-right">Total</th>
                <th className="py-3 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, index) => (
                <tr key={item.id} className="group hover:bg-gray-50">
                  <td className="py-3 px-2 text-sm text-gray-400">{index + 1}</td>
                  <td className="py-3 px-2">
                    <input 
                      type="text" 
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="font-bold text-slate-800 bg-transparent border-none focus:ring-0 w-full p-0"
                    />
                    <input 
                      type="text" 
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      placeholder="UNIT"
                      className="text-[10px] text-gray-400 uppercase font-bold bg-transparent border-none focus:ring-0 p-0 block"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input 
                      type="number" 
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className={`w-20 px-2 py-1 border rounded focus:ring-2 outline-none font-bold ${
                        errors[`item-${index}-qty`] ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-indigo-500'
                      }`}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input 
                      type="number" 
                      value={item.price || ''}
                      onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="py-3 px-2 text-right font-black text-slate-800">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button onClick={() => removeItem(item.id)} className="text-red-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 italic font-medium">
                    Use smart search above to add items. Any new item is saved to master automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-end bg-slate-50 p-6 rounded-xl border border-slate-100">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            {items.length} Items Listed
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Grand Total</span>
            <span className="text-4xl font-black text-indigo-600 tracking-tight">{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {Object.keys(errors).length > 0 && (
             <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please fix the errors before saving.
             </div>
          )}
          <button
            onClick={handleSave}
            className="w-full px-12 py-5 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            SAVE & PRINT INVOICE
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
