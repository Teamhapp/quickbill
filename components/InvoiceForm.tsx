
import React, { useState, useEffect, useRef } from 'react';
import { Product, InvoiceItem, Invoice, UserProfile, Customer } from '../types';
import { StorageService } from '../services/storage';
import { formatCurrency, validateGSTIN } from '../services/formatters';

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
  const [invoiceNumber, setInvoiceNumber] = useState(StorageService.getNextInvoiceNumber());
  const [isMemoryLoaded, setIsMemoryLoaded] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSelectedIndex, setProductSelectedIndex] = useState(-1);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSelectedIndex, setCustomerSelectedIndex] = useState(-1);

  const productRef = useRef<HTMLDivElement>(null);
  const customerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus product search for fast billing
    searchInputRef.current?.focus();

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

  // Enhanced Product Search Logic (Fuzzy + ID Search)
  useEffect(() => {
    if (productSearch.trim()) {
      const query = productSearch.toLowerCase();
      const queryWords = query.split(/\s+/).filter(w => w.length > 0);
      
      const scored = products.map(p => {
        const id = (p.id || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        let score = 0;

        // 1. Exact matches (Highest Priority)
        if (id === query) score += 5000;
        if (name === query) score += 4000;

        // 2. Prefix matching
        if (id.startsWith(query)) score += 3000;
        if (name.startsWith(query)) score += 2000;

        // 3. Multi-word keyword matching (Order independent)
        const allWordsPresent = queryWords.every(word => name.includes(word) || id.includes(word));
        if (allWordsPresent) {
          score += 1000;
          // Bonus for matching query as a contiguous string
          if (name.includes(query) || id.includes(query)) score += 500;
        }

        // 4. Fuzzy / Subsequence matching (Last resort for typos)
        if (score === 0) {
          let qIdx = 0, nIdx = 0, gaps = 0;
          const target = name; // Prefer name for fuzzy subsequence
          while (qIdx < query.length && nIdx < target.length) {
            if (query[qIdx] === target[nIdx]) {
              qIdx++;
            } else {
              gaps++;
            }
            nIdx++;
          }
          if (qIdx === query.length) {
            // Found subsequence - score based on density
            score += Math.max(1, 100 - gaps);
          }
        }

        return { product: p, score };
      })
      .filter(res => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(res => res.product);

      setProductResults(scored.slice(0, 10)); // Slightly more results for better fuzzy choice
      setShowProductDropdown(true);
      setProductSelectedIndex(0);
    } else {
      setShowProductDropdown(false);
      setProductResults([]);
      setProductSelectedIndex(-1);
    }
  }, [productSearch, products]);

  // Keyboard navigation for Product Search
  const handleProductKeyDown = (e: React.KeyboardEvent) => {
    if (!showProductDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setProductSelectedIndex(prev => (prev < productResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setProductSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (productSelectedIndex >= 0 && productResults[productSelectedIndex]) {
        addItem(productResults[productSelectedIndex]);
      } else if (productSearch.trim()) {
        addCustomItem();
      }
    } else if (e.key === 'Escape') {
      setShowProductDropdown(false);
    }
  };

  const addItem = (product: Product) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      updateItem(existing.id, 'quantity', existing.quantity + 1);
    } else {
      const gstRate = user.gstEnabled ? product.gstRate : 0;
      const total = calculateItemTotal(product.price, 1, gstRate);
      
      const newItem: InvoiceItem = {
        id: Math.random().toString(36).substring(2, 11),
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        unit: product.unit,
        gstRate: gstRate,
        total: total
      };
      setItems([...items, newItem]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const addCustomItem = () => {
    const gstRate = user.gstEnabled ? user.defaultGstRate : 0;
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substring(2, 11),
      productId: 'custom-' + Date.now(),
      name: productSearch,
      quantity: 1,
      price: 0,
      unit: 'unit',
      gstRate: gstRate,
      total: 0
    };
    setItems([...items, newItem]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const calculateItemTotal = (price: number, quantity: number, gstRate: number) => {
    if (!user.gstEnabled) return price * quantity;
    
    if (user.isGstInclusive) {
      // Price already includes GST, so total is just price * quantity
      return price * quantity;
    } else {
      // Price is exclusive, total is (price * quantity) + GST
      const sub = price * quantity;
      return sub + (sub * (gstRate / 100));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price' || field === 'gstRate') {
          updated.total = calculateItemTotal(updated.price, updated.quantity, updated.gstRate);
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!validateGSTIN(customerGSTIN)) newErrors.customerGSTIN = 'Invalid GSTIN format';
    if (items.length === 0) newErrors.items = 'Add at least one item';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let subTotal = 0;
    let totalGst = 0;

    items.forEach(item => {
      if (!user.gstEnabled) {
        subTotal += item.total;
        totalGst = 0;
      } else if (user.isGstInclusive) {
        // Calculate backward from inclusive price
        const gstAmount = item.total - (item.total / (1 + item.gstRate / 100));
        totalGst += gstAmount;
        subTotal += (item.total - gstAmount);
      } else {
        const itemSub = item.price * item.quantity;
        const itemGst = itemSub * (item.gstRate / 100);
        subTotal += itemSub;
        totalGst += itemGst;
      }
    });

    const invoice: Invoice = {
      id: Math.random().toString(36).substring(2, 11),
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      customerName: customerName.trim(),
      customerAddress,
      customerGSTIN: customerGSTIN || undefined,
      customerPhone: customerPhone || undefined,
      items,
      subTotal,
      totalGst,
      grandTotal: subTotal + totalGst,
      status: 'Paid',
      createdAt: Date.now()
    };
    
    onSave(invoice);
    setInvoiceNumber(StorageService.getNextInvoiceNumber());
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
      {isMemoryLoaded && (
        <div className="absolute top-4 right-4 animate-bounce z-10">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-sm">
            ⚡ Last Billing Data Loaded
          </span>
        </div>
      )}

      <div className="p-6 space-y-8">
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Generate Bill</h2>
            <p className="text-gray-500 text-sm">Muscle memory billing: Search → Tab → Enter</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-black uppercase text-indigo-400">Invoice Number</span>
            <p className="font-mono text-lg font-bold text-indigo-600">{invoiceNumber}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Customer Name</label>
            <input 
              type="text" 
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="e.g. Atlas Builders"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none font-bold ${
                errors.customerName ? 'border-red-500' : 'border-gray-200 focus:ring-indigo-500'
              }`}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contact Number</label>
            <input 
              type="text" 
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="98765..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">GSTIN (Optional)</label>
            <input 
              type="text" 
              value={customerGSTIN}
              onChange={e => setCustomerGSTIN(e.target.value.toUpperCase())}
              placeholder="29ABC..."
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none font-mono ${
                errors.customerGSTIN ? 'border-red-500' : 'border-gray-200 focus:ring-indigo-500'
              }`}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Shipping Address</label>
            <input 
              type="text" 
              value={customerAddress}
              onChange={e => setCustomerAddress(e.target.value)}
              placeholder="Location..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            />
          </div>
        </div>

        {/* Product Search Input */}
        <div className="relative" ref={productRef}>
          <label className="block text-sm font-black text-indigo-500 uppercase mb-2 tracking-widest">Search Product / ID</label>
          <input 
            ref={searchInputRef}
            type="text" 
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            onKeyDown={handleProductKeyDown}
            placeholder="Search by ID or Name... (Fuzzy matching enabled)"
            className="w-full px-6 py-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-xl font-bold text-indigo-900 transition-all"
          />
          
          {showProductDropdown && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
              {productResults.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => addItem(p)}
                  onMouseEnter={() => setProductSelectedIndex(idx)}
                  className={`w-full px-6 py-4 text-left flex justify-between items-center transition-colors border-b border-gray-50 last:border-0 ${
                    productSelectedIndex === idx ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-xs px-2 py-1 rounded ${productSelectedIndex === idx ? 'bg-indigo-400 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{p.id}</span>
                    <span className="font-bold text-lg">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${productSelectedIndex === idx ? 'text-white' : 'text-indigo-600'}`}>₹{p.price} / {p.unit}</p>
                    {user.gstEnabled && <p className={`text-[10px] font-bold ${productSelectedIndex === idx ? 'text-indigo-200' : 'text-slate-400'}`}>GST: {p.gstRate}% {user.isGstInclusive ? '(Incl)' : '(Excl)'}</p>}
                  </div>
                </button>
              ))}
              {productResults.length === 0 && (
                <div className="p-6 text-center text-gray-400 font-bold">
                  Press Enter to add "{productSearch}" as a custom item
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="bg-slate-50 rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="pb-4 px-2">#</th>
                <th className="pb-4 px-2">Description</th>
                <th className="pb-4 px-2 w-24">Qty</th>
                <th className="pb-4 px-2 w-32">Price</th>
                {user.gstEnabled && <th className="pb-4 px-2 w-24">GST %</th>}
                <th className="pb-4 px-2 w-32 text-right">Total</th>
                <th className="pb-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, idx) => (
                <tr key={item.id} className="group">
                  <td className="py-4 px-2 text-sm text-gray-400">{idx + 1}</td>
                  <td className="py-4 px-2">
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{item.unit}</span>
                  </td>
                  <td className="py-4 px-2">
                    <input 
                      type="number" 
                      value={item.quantity || ''}
                      onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 font-bold text-center"
                    />
                  </td>
                  <td className="py-4 px-2 font-bold">
                    <input 
                      type="number" 
                      value={item.price || ''}
                      onChange={e => updateItem(item.id, 'price', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </td>
                  {user.gstEnabled && (
                    <td className="py-4 px-2">
                      <select 
                        value={item.gstRate}
                        onChange={e => updateItem(item.id, 'gstRate', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                      >
                        <option value={0}>0</option>
                        <option value={5}>5</option>
                        <option value={12}>12</option>
                        <option value={18}>18</option>
                        <option value={28}>28</option>
                      </select>
                    </td>
                  )}
                  <td className="py-4 px-2 text-right font-black text-slate-800">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <button onClick={() => removeItem(item.id)} className="text-red-300 hover:text-red-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <div className="w-full md:w-80 space-y-3">
             <div className="flex justify-between text-gray-500 text-sm">
               <span>Subtotal</span>
               <span className="font-bold">
                 {formatCurrency(items.reduce((s,i) => {
                    if (!user.gstEnabled) return s + i.total;
                    if (user.isGstInclusive) {
                      const gstAmount = i.total - (i.total / (1 + i.gstRate / 100));
                      return s + (i.total - gstAmount);
                    }
                    return s + (i.price * i.quantity);
                 }, 0))}
               </span>
             </div>
             {user.gstEnabled && (
               <div className="flex justify-between text-gray-500 text-sm">
                 <span>GST Amount</span>
                 <span className="font-bold">
                   {formatCurrency(items.reduce((s,i) => {
                      if (user.isGstInclusive) {
                        return s + (i.total - (i.total / (1 + i.gstRate / 100)));
                      }
                      return s + (i.price * i.quantity * (i.gstRate / 100));
                   }, 0))}
                 </span>
               </div>
             )}
             <div className="flex justify-between items-center bg-indigo-600 text-white p-4 rounded-xl shadow-lg">
               <span className="font-bold uppercase tracking-widest text-xs">Grand Total</span>
               <span className="text-3xl font-black">{formatCurrency(items.reduce((s,i)=>s+i.total,0))}</span>
             </div>
             <button
              onClick={handleSave}
              className="w-full py-5 bg-slate-900 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-black active:scale-95 transition-all"
            >
              GENERATE & PRINT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
