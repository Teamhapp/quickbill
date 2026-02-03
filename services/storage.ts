
import { Invoice, Product, UserProfile, Customer } from '../types';

const KEYS = {
  ACCOUNTS: 'qb_accounts',
  CURRENT_USER_EMAIL: 'qb_current_user',
  SESSION_TOKEN: 'qb_session_active'
};

const DEFAULT_PROFILE_TEMPLATE = (businessName: string, email: string): UserProfile => ({
  businessName: businessName || 'My Business',
  address: '',
  gstin: '',
  phone: '',
  email: email,
  currency: 'INR',
  currencySymbol: '₹',
  taxEnabled: true,
  defaultTaxRate: 18,
  isTaxInclusive: false,
  state: '',
  invoicePrefix: 'INV',
  nextNumber: 1,
  availableUnits: ['pcs', 'kg', 'nos', 'm', 'bags', 'units', 'box', 'set', 'sqft', 'ton'],
  signatureTitle: 'For ' + (businessName || 'My Business'),
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Payment should be made by due date.\n3. Interest @ 18% p.a. will be charged for delayed payment.'
});

export const StorageService = {
  isLoggedIn: (): boolean => {
    return localStorage.getItem(KEYS.SESSION_TOKEN) === 'true' && !!localStorage.getItem(KEYS.CURRENT_USER_EMAIL);
  },

  signup: (email: string, password: string, businessName: string): boolean => {
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    if (accounts[email]) return false;

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

  getCurrentUserEmail: () => localStorage.getItem(KEYS.CURRENT_USER_EMAIL),

  getUser: (): UserProfile => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    const profile = accounts[email || '']?.profile;
    
    if (profile && !profile.currency) {
      profile.currency = 'INR';
      profile.currencySymbol = '₹';
    }
    
    return profile || DEFAULT_PROFILE_TEMPLATE('', '');
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
    return `${prefix}-${num.toString().padStart(4, '0')}`;
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

    const customers = accounts[email].customers as Customer[];
    const invName = invoice.customerName.trim();
    const invPhone = invoice.customerPhone?.trim();
    
    const existingCustIdx = customers.findIndex(c => 
      c.name.trim().toLowerCase() === invName.toLowerCase() && 
      (!invPhone || !c.phone || c.phone.trim() === invPhone)
    );
    
    if (existingCustIdx > -1) {
      customers[existingCustIdx] = {
        ...customers[existingCustIdx],
        address: invoice.customerAddress || customers[existingCustIdx].address,
        gstin: invoice.customerGstin || customers[existingCustIdx].gstin,
        phone: invoice.customerPhone || customers[existingCustIdx].phone,
        state: invoice.customerState || customers[existingCustIdx].state
      };
    } else {
      customers.push({
        id: Math.random().toString(36).substring(2, 11),
        name: invoice.customerName,
        address: invoice.customerAddress,
        gstin: invoice.customerGstin,
        phone: invoice.customerPhone,
        state: invoice.customerState
      });
    }

    const products = accounts[email].products as Product[];
    invoice.items.forEach(item => {
      const existingProdIdx = products.findIndex(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      if (existingProdIdx === -1) {
        products.push({
          id: item.productId.startsWith('custom-') ? Math.random().toString(36).substring(2, 11) : item.productId,
          name: item.name,
          hsnCode: item.hsnCode,
          unit: item.unit,
          price: item.price,
          taxRate: item.taxRate
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
