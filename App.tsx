
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

const App: React.FC = () => {
  const [activeView, setView] = useState<View>('login');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [user, setUser] = useState<UserProfile>(StorageService.getUser());
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [shouldPrint, setShouldPrint] = useState(false);

  useEffect(() => {
    if (StorageService.isLoggedIn()) {
      setView('invoice');
      refreshData();
    } else {
      setView('login');
    }
  }, []);

  // Native printing trigger logic
  useEffect(() => {
    if (previewInvoice && shouldPrint) {
      // 500ms stabilization allows React to fully render the PDF content
      // before the system's print dialog interrupts the execution.
      const timer = setTimeout(() => {
        window.print();
        setShouldPrint(false);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [previewInvoice, shouldPrint]);

  const refreshData = () => {
    setInvoices(StorageService.getInvoices());
    setProducts(StorageService.getProducts());
    setCustomers(StorageService.getCustomers());
    setUser(StorageService.getUser());
  };

  const handleLogin = () => {
    StorageService.login();
    refreshData();
    setView('invoice');
  };

  const handleLogout = () => {
    StorageService.logout();
    setView('login');
  };

  const saveInvoice = (inv: Invoice) => {
    try {
      StorageService.saveInvoice(inv);
      refreshData();
      setPreviewInvoice(inv);
      setShouldPrint(true);
    } catch (e) {
      console.error('Failed to save invoice', e);
      alert('Error: Local storage is full or restricted. Please clear history.');
    }
  };

  const updateProducts = (newProducts: Product[]) => {
    StorageService.saveProducts(newProducts);
    setProducts(newProducts);
  };

  const updateCustomers = (newCustomers: Customer[]) => {
    StorageService.saveCustomers(newCustomers);
    setCustomers(newCustomers);
  };

  const updateUser = (newUser: UserProfile) => {
    StorageService.saveUser(newUser);
    setUser(newUser);
  };

  if (activeView === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-600 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-indigo-800">QuickBill</h1>
            <p className="text-gray-500">India's Speed-First Billing App</p>
          </div>
          
          <div className="py-8 bg-indigo-50 rounded-xl border border-indigo-100">
            <svg className="w-16 h-16 mx-auto text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
            <p className="font-semibold text-indigo-900">Get Paid 2x Faster</p>
            <p className="text-xs text-indigo-400">Customers & Products saved automatically</p>
          </div>

          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            GET STARTED NOW
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </button>
          
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Built for Indian Wholesalers & Traders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* 
          PDF Layer: This is always present in the DOM for media queries to find,
          but visibility is controlled via the .print-only class in index.html
      */}
      {previewInvoice && <InvoicePDF invoice={previewInvoice} user={user} />}

      <Layout activeView={activeView} setView={setView} onLogout={handleLogout}>
        <div className="no-print">
          {activeView === 'invoice' && (
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
          
          {activeView === 'products' && (
            <ProductMaster products={products} onSave={updateProducts} />
          )}

          {activeView === 'customers' && (
            <CustomerMaster customers={customers} onSave={updateCustomers} />
          )}
          
          {activeView === 'profile' && (
            <ProfileSettings user={user} onSave={updateUser} />
          )}
        </div>
      </Layout>
    </div>
  );
};

export default App;
