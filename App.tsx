
import React, { useState, useEffect } from 'react';
import { View, Invoice, Product, UserProfile, Customer } from './types';
import { StorageService } from './services/storage';
import Layout from './components/Layout';
import InvoiceForm from './components/InvoiceForm';
import HistoryView from './components/HistoryView';
import ProductMaster from './components/ProductMaster';
import CustomerMaster from './components/CustomerMaster';
import ProfileSettings from './components/ProfileSettings';
import InvoicePDF from './components/InvoicePDF';
import AuthView from './components/AuthView';

const App: React.FC = () => {
  const [activeView, setView] = useState<View>('login');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (StorageService.isLoggedIn()) {
        await refreshData();
        setView('invoice');
      } else {
        setView('login');
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (previewInvoice && shouldPrint) {
      const timer = setTimeout(() => {
        window.print();
        setShouldPrint(false);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [previewInvoice, shouldPrint]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [u, invs, prods, custs] = await Promise.all([
        StorageService.getUser(),
        StorageService.getInvoices(),
        StorageService.getProducts(),
        StorageService.getCustomers()
      ]);
      setUser(u);
      setInvoices(invs);
      setProducts(prods);
      setCustomers(custs);
    } catch (e) {
      console.error("Data refresh failed", e);
    }
    setLoading(false);
  };

  const onAuthSuccess = async () => {
    await refreshData();
    setView('invoice');
  };

  const handleLogout = () => {
    StorageService.logout();
    setView('login');
    setInvoices([]);
    setProducts([]);
    setCustomers([]);
    setPreviewInvoice(null);
    setUser(null);
  };

  const saveInvoice = async (inv: Invoice) => {
    setLoading(true);
    try {
      await StorageService.saveInvoice(inv);
      await refreshData();
      setPreviewInvoice(inv);
      setShouldPrint(true);
    } catch (e) {
      console.error('Failed to save invoice', e);
      alert('Error: Local storage limit or network error.');
    }
    setLoading(false);
  };

  const updateProducts = async (newProducts: Product[]) => {
    setLoading(true);
    await StorageService.saveProducts(newProducts);
    setProducts(newProducts);
    setLoading(false);
  };

  const updateCustomers = async (newCustomers: Customer[]) => {
    setLoading(true);
    await StorageService.saveCustomers(newCustomers);
    setCustomers(newCustomers);
    setLoading(false);
  };

  const updateUser = async (newUser: UserProfile) => {
    setLoading(true);
    await StorageService.saveUser(newUser);
    setUser(newUser);
    setLoading(false);
  };

  if (activeView === 'login') {
    return <AuthView onLogin={onAuthSuccess} />;
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {loading && (
        <div className="no-print fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-xs uppercase tracking-widest text-indigo-600">Syncing Workspace...</p>
        </div>
      )}

      {previewInvoice && user && <InvoicePDF invoice={previewInvoice} user={user} />}

      <Layout activeView={activeView} setView={setView} onLogout={handleLogout}>
        <div className="no-print">
          {activeView === 'invoice' && user && (
            <InvoiceForm 
              onSave={saveInvoice} 
              user={user} 
              products={products}
              customers={customers}
            />
          )}
          
          {activeView === 'history' && (
            <HistoryView 
              invoices={invoices} 
              onPreview={(inv) => {
                setPreviewInvoice(inv);
                setShouldPrint(true);
              }} 
            />
          )}
          
          {activeView === 'products' && user && (
            <ProductMaster products={products} onSave={updateProducts} user={user} />
          )}

          {activeView === 'customers' && (
            <CustomerMaster customers={customers} onSave={updateCustomers} />
          )}
          
          {activeView === 'profile' && user && (
            <ProfileSettings user={user} onSave={updateUser} />
          )}
        </div>
      </Layout>
    </div>
  );
};

export default App;
