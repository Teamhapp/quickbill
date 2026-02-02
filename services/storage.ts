
import { Invoice, Product, UserProfile, Customer } from '../types';

const KEYS = {
  ACCOUNTS: 'qb_accounts', // Stores { email: { password, profile } }
  CURRENT_USER_EMAIL: 'qb_current_user',
  SESSION_TOKEN: 'qb_session_active'
};

const DEFAULT_PROFILE_TEMPLATE = (businessName: string, email: string): UserProfile => ({
  businessName: businessName || 'My Business',
  address: '',
  gstin: '',
  phone: '',
  email: email,
  gstEnabled: true,
  defaultGstRate: 18,
  isGstInclusive: false,
  invoicePrefix: 'INV',
  nextNumber: 1,
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Payment should be made within 7 days.\n3. Subject to Jurisdiction.'
});

export const StorageService = {
  // Auth Logic
  isLoggedIn: (): boolean => {
    return localStorage.getItem(KEYS.SESSION_TOKEN) === 'true' && !!localStorage.getItem(KEYS.CURRENT_USER_EMAIL);
  },

  signup: (email: string, password: string, businessName: string): boolean => {
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    if (accounts[email]) return false; // Already exists

    accounts[email] = {
      password,
      profile: DEFAULT_PROFILE_TEMPLATE(businessName, email),
      products: [],
      customers: [],
      invoices: []
    };
    
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    return true;
  },

  login: (email: string, password: string): boolean => {
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    const user = accounts[email];
    if (user && user.password === password) {
      localStorage.setItem(KEYS.SESSION_TOKEN, 'true');
      localStorage.setItem(KEYS.CURRENT_USER_EMAIL, email);
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem(KEYS.SESSION_TOKEN);
    localStorage.removeItem(KEYS.CURRENT_USER_EMAIL);
  },

  // Scoped Data Access
  getCurrentUserEmail: () => localStorage.getItem(KEYS.CURRENT_USER_EMAIL),

  getUser: (): UserProfile => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    return accounts[email || '']?.profile || DEFAULT_PROFILE_TEMPLATE('', '');
  },

  saveUser: (profile: UserProfile) => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    if (email && accounts[email]) {
      accounts[email].profile = profile;
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
  },

  getNextInvoiceNumber: (): string => {
    const profile = StorageService.getUser();
    const prefix = profile.invoicePrefix || 'INV';
    const num = profile.nextNumber || 1;
    return `${prefix}-${num.toString().padStart(3, '0')}`;
  },

  getProducts: (): Product[] => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    return accounts[email || '']?.products || [];
  },

  saveProducts: (products: Product[]) => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    if (email && accounts[email]) {
      accounts[email].products = products;
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
  },

  getCustomers: (): Customer[] => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    return accounts[email || '']?.customers || [];
  },

  saveCustomers: (customers: Customer[]) => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    if (email && accounts[email]) {
      accounts[email].customers = customers;
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
  },

  getInvoices: (): Invoice[] => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    return accounts[email || '']?.invoices || [];
  },

  saveInvoice: (invoice: Invoice) => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    if (email && accounts[email]) {
      accounts[email].invoices = [invoice, ...accounts[email].invoices];
      accounts[email].lastInvoice = invoice;
      accounts[email].profile.nextNumber += 1;
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
      StorageService.syncMasters(invoice);
    }
  },

  syncMasters: (invoice: Invoice) => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    if (!email || !accounts[email]) return;

    // Sync Customer
    const customers = accounts[email].customers as Customer[];
    if (!customers.some(c => c.name.toLowerCase() === invoice.customerName.toLowerCase())) {
      customers.push({
        id: Math.random().toString(36).substring(2, 11),
        name: invoice.customerName,
        address: invoice.customerAddress,
        gstin: invoice.customerGSTIN,
        phone: invoice.customerPhone
      });
    }

    // Sync Products
    const products = accounts[email].products as Product[];
    invoice.items.forEach(item => {
      if (!products.some(p => p.name.toLowerCase() === item.name.toLowerCase())) {
        products.push({
          id: item.productId.startsWith('custom-') ? Math.random().toString(36).substring(2, 11) : item.productId,
          name: item.name,
          unit: item.unit,
          price: item.price,
          gstRate: item.gstRate
        });
      }
    });

    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getLastInvoice: (): Invoice | null => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    return accounts[email || '']?.lastInvoice || null;
  },

  clearAccountData: () => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    if (email && accounts[email]) {
      accounts[email].invoices = [];
      accounts[email].lastInvoice = null;
      accounts[email].profile.nextNumber = 1;
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
  }
};
