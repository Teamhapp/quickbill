
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

  useEffect(() => {
    if (previewInvoice && shouldPrint) {
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

  const onAuthSuccess = () => {
    refreshData();
    setView('invoice');
  };

  const handleLogout = () => {
    StorageService.logout();
    setView('login');
    // Clear states for next user
    setInvoices([]);
    setProducts([]);
    setCustomers([]);
    setPreviewInvoice(null);
  };

  const saveInvoice = (inv: Invoice) => {
    try {
      StorageService.saveInvoice(inv);
      refreshData();
      setPreviewInvoice(inv);
      setShouldPrint(true);
    } catch (e) {
      console.error('Failed to save invoice', e);
      alert('Error: Local storage limit reached. Please clear old invoices.');
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
    return <AuthView onLogin={onAuthSuccess} />;
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
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
