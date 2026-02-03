
import React, { useState, useMemo } from 'react';
import { Product, UserProfile } from '../types';
import { formatCurrency } from '../services/formatters';
import { StorageService } from '../services/storage';

interface ProductMasterProps {
  products: Product[];
  onSave: (products: Product[]) => void;
}

const ProductMaster: React.FC<ProductMasterProps> = ({ products, onSave }) => {
  const user: UserProfile = StorageService.getUser();
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', hsnCode: '', unit: user.availableUnits[0] || 'pcs', price: 0, taxRate: 18
  });

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.hsnCode && p.hsnCode.includes(q))
    );
  }, [products, searchQuery]);

  const handleAdd = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newProduct.name?.trim()) newErrors.name = 'Required';
    if (newProduct.price === undefined || newProduct.price < 0) newErrors.price = 'Must be >= 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const p: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProduct.name!.trim(),
      hsnCode: newProduct.hsnCode?.trim() || undefined,
      unit: newProduct.unit || 'pcs',
      price: Number(newProduct.price),
      taxRate: Number(newProduct.taxRate || 0)
    };
    onSave([...products, p]);
    setNewProduct({ name: '', hsnCode: '', unit: user.availableUnits[0] || 'pcs', price: 0, taxRate: 18 });
    setErrors({});
    setIsAdding(false);
  };

  const removeProduct = (id: string) => {
    if (confirm('Delete this product from master list?')) {
      onSave(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Product Master</h2>
          <p className="text-slate-500 font-medium italic">Your daily inventory shortcuts.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="px-4 py-3 bg-white border-2 border-slate-100 rounded-xl outline-none font-bold shadow-sm"
          />
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              ADD ITEM
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Item Name</label>
              <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className={`w-full px-3 py-3 bg-slate-50 border ${errors.name ? 'border-red-400' : 'border-slate-200'} rounded-xl font-bold`} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">HSN/SAC (Optional)</label>
              <input type="text" value={newProduct.hsnCode} onChange={e => setNewProduct({...newProduct, hsnCode: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Selling Price</label>
              <input type="number" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className={`w-full px-3 py-3 bg-slate-50 border ${errors.price ? 'border-red-400' : 'border-slate-200'} rounded-xl font-bold`} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">GST Rate (%)</label>
              <select value={newProduct.taxRate} onChange={e => setNewProduct({...newProduct, taxRate: Number(e.target.value)})} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}% GST</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Unit</label>
              <select value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase">
                {user.availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 font-bold">Cancel</button>
            <button onClick={handleAdd} className="px-6 py-2 bg-indigo-600 text-white font-black rounded-xl">SAVE PRODUCT</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase">Item Details</th>
              <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase">HSN/SAC</th>
              <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase">GST Slab</th>
              <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase text-right">Price</th>
              <th className="py-4 px-6 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-bold">
            {filteredProducts.length > 0 ? filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="text-slate-900">{p.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">{p.unit}</div>
                </td>
                <td className="py-4 px-6 text-slate-500 font-mono text-xs">{p.hsnCode || '—'}</td>
                <td className="py-4 px-6 text-slate-400 text-xs">{p.taxRate}% GST</td>
                <td className="py-4 px-6 text-right text-indigo-700">{formatCurrency(p.price)}</td>
                <td className="py-4 px-6">
                  <button onClick={() => removeProduct(p.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-bold italic text-sm">No products found in master list.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductMaster;
