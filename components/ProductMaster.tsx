
import React, { useState } from 'react';
import { Product } from '../types';
import { formatCurrency } from '../services/formatters';

interface ProductMasterProps {
  products: Product[];
  onSave: (products: Product[]) => void;
}

const ProductMaster: React.FC<ProductMasterProps> = ({ products, onSave }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', unit: 'unit', price: 0, gstRate: 0
  });

  const handleAdd = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newProduct.name?.trim()) newErrors.name = 'Name is required';
    if (!newProduct.price || newProduct.price <= 0) newErrors.price = 'Price must be > 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const p: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProduct.name!.trim(),
      unit: newProduct.unit || 'unit',
      price: Number(newProduct.price),
      gstRate: Number(newProduct.gstRate || 0)
    };
    const updated = [...products, p];
    onSave(updated);
    setNewProduct({ name: '', unit: 'unit', price: 0, gstRate: 0 });
    setErrors({});
    setIsAdding(false);
  };

  const removeProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      onSave(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Product Master</h2>
          <p className="text-gray-500">Save products once, use them everywhere</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all"
          >
            + New Product
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm">
          <h3 className="font-bold mb-4 text-xs uppercase text-indigo-500">Add Single Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Product Name</label>
              <input 
                type="text" 
                value={newProduct.name}
                onChange={e => {
                  setNewProduct({...newProduct, name: e.target.value});
                  if (errors.name) setErrors({...errors, name: ''});
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${
                  errors.name ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="e.g. Cement Bag 50kg"
              />
              {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Unit</label>
              <input 
                type="text"
                value={newProduct.unit}
                onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="unit / kg / bag"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Base Price (₹)</label>
              <input 
                type="number" 
                value={newProduct.price || ''}
                onChange={e => {
                  setNewProduct({...newProduct, price: Number(e.target.value)});
                  if (errors.price) setErrors({...errors, price: ''});
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${
                  errors.price ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
              {errors.price && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">GST Rate (%)</label>
              <select 
                value={newProduct.gstRate}
                onChange={e => setNewProduct({...newProduct, gstRate: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => { setIsAdding(false); setErrors({}); }}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
            >
              Save Product
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Product Name</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Unit</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">GST %</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Base Price</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length > 0 ? (
              products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">{p.name}</td>
                  <td className="py-4 px-6 text-gray-600 uppercase text-sm">{p.unit}</td>
                  <td className="py-4 px-6 text-gray-600">{p.gstRate}%</td>
                  <td className="py-4 px-6 text-right font-bold text-indigo-600">{formatCurrency(p.price)}</td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => removeProduct(p.id)}
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
                <td colSpan={5} className="py-16 text-center text-gray-400 italic">
                  No products saved. Add your regular items here to save time during billing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductMaster;
