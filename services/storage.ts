
import * as Realm from "https://esm.sh/realm-web";
import { Invoice, Product, UserProfile, Customer } from '../types';

const KEYS = {
  ACCOUNTS: 'qb_accounts',
  CURRENT_USER_EMAIL: 'qb_current_user',
  SESSION_TOKEN: 'qb_session_active',
  MONGO_APP_ID: 'qb_mongo_app_id',
  LAST_INVOICE: 'qb_last_invoice'
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

let realmApp: Realm.App | null = null;

const getMongoApp = () => {
  const appId = localStorage.getItem(KEYS.MONGO_APP_ID);
  if (!appId) return null;
  if (!realmApp || realmApp.id !== appId) {
    realmApp = new Realm.App({ id: appId });
  }
  return realmApp;
};

export const StorageService = {
  setMongoAppId: (id: string) => {
    localStorage.setItem(KEYS.MONGO_APP_ID, id);
    realmApp = null; // Reset instance
  },

  getMongoAppId: () => localStorage.getItem(KEYS.MONGO_APP_ID) || '',

  isLoggedIn: (): boolean => {
    return localStorage.getItem(KEYS.SESSION_TOKEN) === 'true';
  },

  signup: async (email: string, password: string, businessName: string): Promise<boolean> => {
    const app = getMongoApp();
    if (app) {
      try {
        await app.emailPasswordAuth.registerUser({ email, password });
        const credentials = Realm.Credentials.emailPassword(email, password);
        const user = await app.logIn(credentials);
        
        // Initialize profile in MongoDB
        const mongodb = user.mongoClient("mongodb-atlas");
        const profiles = mongodb.db("quickbill").collection("profiles");
        await profiles.insertOne({
          owner_id: user.id,
          email,
          profile: DEFAULT_PROFILE_TEMPLATE(businessName, email),
          products: [],
          customers: [],
          invoices: []
        });
        
        localStorage.setItem(KEYS.SESSION_TOKEN, 'true');
        localStorage.setItem(KEYS.CURRENT_USER_EMAIL, email);
        return true;
      } catch (e) {
        console.error("MongoDB Signup Error", e);
        return false;
      }
    } else {
      // Local Fallback
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
    }
  },

  login: async (email: string, password: string): Promise<boolean> => {
    const app = getMongoApp();
    if (app) {
      try {
        const credentials = Realm.Credentials.emailPassword(email, password);
        await app.logIn(credentials);
        localStorage.setItem(KEYS.SESSION_TOKEN, 'true');
        localStorage.setItem(KEYS.CURRENT_USER_EMAIL, email);
        return true;
      } catch (e) {
        console.error("MongoDB Login Error", e);
        return false;
      }
    } else {
      const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
      const user = accounts[email];
      if (user && user.password === password) {
        localStorage.setItem(KEYS.SESSION_TOKEN, 'true');
        localStorage.setItem(KEYS.CURRENT_USER_EMAIL, email);
        return true;
      }
      return false;
    }
  },

  logout: () => {
    const app = getMongoApp();
    if (app && app.currentUser) {
      app.currentUser.logOut();
    }
    localStorage.removeItem(KEYS.SESSION_TOKEN);
    localStorage.removeItem(KEYS.CURRENT_USER_EMAIL);
  },

  getCurrentUserEmail: () => localStorage.getItem(KEYS.CURRENT_USER_EMAIL),

  getUser: async (): Promise<UserProfile> => {
    const app = getMongoApp();
    const email = StorageService.getCurrentUserEmail();
    if (app && app.currentUser) {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const profiles = mongodb.db("quickbill").collection("profiles");
      const data = await profiles.findOne({ owner_id: app.currentUser.id });
      return data?.profile || DEFAULT_PROFILE_TEMPLATE('', email || '');
    }
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    return accounts[email || '']?.profile || DEFAULT_PROFILE_TEMPLATE('', email || '');
  },

  saveUser: async (profile: UserProfile) => {
    const app = getMongoApp();
    if (app && app.currentUser) {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const profiles = mongodb.db("quickbill").collection("profiles");
      await profiles.updateOne(
        { owner_id: app.currentUser.id },
        { $set: { profile: profile } }
      );
    } else {
      const email = StorageService.getCurrentUserEmail();
      const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
      if (email && accounts[email]) {
        accounts[email].profile = profile;
        localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
      }
    }
  },

  getProducts: async (): Promise<Product[]> => {
    const app = getMongoApp();
    if (app && app.currentUser) {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const profiles = mongodb.db("quickbill").collection("profiles");
      const data = await profiles.findOne({ owner_id: app.currentUser.id });
      return data?.products || [];
    }
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    return accounts[email || '']?.products || [];
  },

  saveProducts: async (products: Product[]) => {
    const app = getMongoApp();
    if (app && app.currentUser) {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const profiles = mongodb.db("quickbill").collection("profiles");
      await profiles.updateOne(
        { owner_id: app.currentUser.id },
        { $set: { products: products } }
      );
    } else {
      const email = StorageService.getCurrentUserEmail();
      const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
      if (email && accounts[email]) {
        accounts[email].products = products;
        localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
      }
    }
  },

  getCustomers: async (): Promise<Customer[]> => {
    const app = getMongoApp();
    if (app && app.currentUser) {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const profiles = mongodb.db("quickbill").collection("profiles");
      const data = await profiles.findOne({ owner_id: app.currentUser.id });
      return data?.customers || [];
    }
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    return accounts[email || '']?.customers || [];
  },

  saveCustomers: async (customers: Customer[]) => {
    const app = getMongoApp();
    if (app && app.currentUser) {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const profiles = mongodb.db("quickbill").collection("profiles");
      await profiles.updateOne(
        { owner_id: app.currentUser.id },
        { $set: { customers: customers } }
      );
    } else {
      const email = StorageService.getCurrentUserEmail();
      const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
      if (email && accounts[email]) {
        accounts[email].customers = customers;
        localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
      }
    }
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const app = getMongoApp();
    if (app && app.currentUser) {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const profiles = mongodb.db("quickbill").collection("profiles");
      const data = await profiles.findOne({ owner_id: app.currentUser.id });
      return data?.invoices || [];
    }
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    return accounts[email || '']?.invoices || [];
  },

  saveInvoice: async (invoice: Invoice) => {
    // 1. Save to Local for Muscle Memory (Fast Access)
    localStorage.setItem(KEYS.LAST_INVOICE, JSON.stringify(invoice));

    // 2. Persistent Storage (Sync)
    const app = getMongoApp();
    if (app && app.currentUser) {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const profiles = mongodb.db("quickbill").collection("profiles");
      
      const data = await profiles.findOne({ owner_id: app.currentUser.id });
      const currentInvoices = data?.invoices || [];
      const currentProfile = data?.profile || DEFAULT_PROFILE_TEMPLATE('', app.currentUser.profile.email || '');
      
      currentProfile.nextNumber += 1;

      await profiles.updateOne(
        { owner_id: app.currentUser.id },
        { 
          $set: { 
            invoices: [invoice, ...currentInvoices],
            lastInvoice: invoice,
            profile: currentProfile
          } 
        }
      );
      await StorageService.syncMastersAsync(invoice);
    } else {
      const email = StorageService.getCurrentUserEmail();
      const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
      if (email && accounts[email]) {
        accounts[email].invoices = [invoice, ...accounts[email].invoices];
        accounts[email].lastInvoice = invoice;
        accounts[email].profile.nextNumber += 1;
        localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
        StorageService.syncMastersSync(invoice);
      }
    }
  },

  syncMastersAsync: async (invoice: Invoice) => {
    const app = getMongoApp();
    if (!app || !app.currentUser) return;
    const mongodb = app.currentUser.mongoClient("mongodb-atlas");
    const profiles = mongodb.db("quickbill").collection("profiles");
    const data = await profiles.findOne({ owner_id: app.currentUser.id });
    if (!data) return;

    const customers = [...(data.customers || [])];
    const products = [...(data.products || [])];

    // Sync Customer
    const invName = invoice.customerName.trim();
    const existingCustIdx = customers.findIndex(c => c.name.toLowerCase() === invName.toLowerCase());
    if (existingCustIdx > -1) {
      customers[existingCustIdx] = { ...customers[existingCustIdx], address: invoice.customerAddress, gstin: invoice.customerGstin, phone: invoice.customerPhone };
    } else {
      customers.push({ id: Math.random().toString(36).substr(2, 9), name: invoice.customerName, address: invoice.customerAddress, gstin: invoice.customerGstin, phone: invoice.customerPhone });
    }

    // Sync Products
    invoice.items.forEach(item => {
      if (!products.some(p => p.name.toLowerCase() === item.name.toLowerCase())) {
        products.push({ id: item.productId, name: item.name, hsnCode: item.hsnCode, unit: item.unit, price: item.price, taxRate: item.taxRate });
      }
    });

    await profiles.updateOne({ owner_id: app.currentUser.id }, { $set: { customers, products } });
  },

  syncMastersSync: (invoice: Invoice) => {
    const email = StorageService.getCurrentUserEmail();
    const accounts = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '{}');
    if (!email || !accounts[email]) return;
    // ... existing sync logic simplified for local storage ...
    const customers = accounts[email].customers as Customer[];
    if (!customers.some(c => c.name.toLowerCase() === invoice.customerName.toLowerCase())) {
        customers.push({ id: Math.random().toString(36).substr(2,9), name: invoice.customerName, address: invoice.customerAddress, gstin: invoice.customerGstin, phone: invoice.customerPhone });
    }
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getLastInvoice: (): Invoice | null => {
    const last = localStorage.getItem(KEYS.LAST_INVOICE);
    return last ? JSON.parse(last) : null;
  },

  clearAccountData: async () => {
    const app = getMongoApp();
    if (app && app.currentUser) {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const profiles = mongodb.db("quickbill").collection("profiles");
      const data = await profiles.findOne({ owner_id: app.currentUser.id });
      if (data) {
        data.profile.nextNumber = 1;
        await profiles.updateOne({ owner_id: app.currentUser.id }, { $set: { invoices: [], lastInvoice: null, profile: data.profile } });
      }
    }
    localStorage.removeItem(KEYS.LAST_INVOICE);
  }
};
