
import { Invoice, Product, UserProfile, Customer } from '../types';

const KEYS = {
  USER: 'qb_user_profile',
  PRODUCTS: 'qb_products',
  CUSTOMERS: 'qb_customers',
  INVOICES: 'qb_invoices',
  LAST_INVOICE: 'qb_last_invoice',
  AUTH: 'qb_is_logged_in'
};

// Sample data from the PDF
const DEFAULT_USER: UserProfile = {
  businessName: 'Dhanam Agencies',
  address: 'Manikandan .P',
  gstin: '',
  phone: '+91 98433 93841',
  email: 'manikandan777rocks@gmail.com'
};

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-atlas-001',
    name: 'Atlas builders',
    address: 'Gem nagar , Karayampalayam, Myilampatti',
    phone: '+916238638259'
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-msand-001',
    name: 'M sand',
    unit: 'unit',
    price: 6000,
    gstRate: 0
  },
  {
    id: 'prod-jally-001',
    name: '3/4" jally',
    unit: 'unit',
    price: 4375,
    gstRate: 0
  }
];

const DEFAULT_INVOICE: Invoice = {
  id: 'inv-sample-001',
  invoiceNumber: 'INV-1',
  date: '2026-02-02',
  customerName: 'Atlas builders',
  customerAddress: 'Gem nagar , Karayampalayam, Myilampatti',
  customerPhone: '+916238638259',
  items: [
    {
      id: 'item-1',
      productId: 'prod-msand-001',
      name: 'M sand',
      quantity: 3,
      price: 6000,
      unit: 'unit',
      gstRate: 0,
      total: 18000
    },
    {
      id: 'item-2',
      productId: 'prod-jally-001',
      name: '3/4" jally',
      quantity: 4,
      price: 4375,
      unit: 'unit',
      gstRate: 0,
      total: 17500
    }
  ],
  subTotal: 35500,
  totalGst: 0,
  grandTotal: 35500,
  status: 'Paid',
  createdAt: new Date('2026-02-02').getTime()
};

export const StorageService = {
  // Auth
  isLoggedIn: (): boolean => localStorage.getItem(KEYS.AUTH) === 'true',
  login: () => localStorage.setItem(KEYS.AUTH, 'true'),
  logout: () => localStorage.removeItem(KEYS.AUTH),

  // User Profile
  getUser: (): UserProfile => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : DEFAULT_USER;
  },
  saveUser: (user: UserProfile) => localStorage.setItem(KEYS.USER, JSON.stringify(user)),

  // Products
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : DEFAULT_PRODUCTS;
  },
  saveProducts: (products: Product[]) => localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products)),
  
  // Customers
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : DEFAULT_CUSTOMERS;
  },
  saveCustomers: (customers: Customer[]) => localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers)),

  // Invoices
  getInvoices: (): Invoice[] => {
    const data = localStorage.getItem(KEYS.INVOICES);
    return data ? JSON.parse(data) : [DEFAULT_INVOICE];
  },
  saveInvoice: (invoice: Invoice) => {
    const invoices = StorageService.getInvoices();
    const updated = [invoice, ...invoices];
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
    localStorage.setItem(KEYS.LAST_INVOICE, JSON.stringify(invoice));
    
    // Auto-save/update customer in master
    const customers = StorageService.getCustomers();
    const normalizedCustomerName = invoice.customerName.trim().toLowerCase();
    const customerIndex = customers.findIndex(c => c.name.trim().toLowerCase() === normalizedCustomerName);
    
    if (customerIndex > -1) {
      const existing = customers[customerIndex];
      const hasChanged = 
        existing.address.trim() !== invoice.customerAddress.trim() || 
        (existing.gstin || '').trim() !== (invoice.customerGSTIN || '').trim() ||
        (existing.phone || '').trim() !== (invoice.customerPhone || '').trim();

      if (hasChanged) {
        const updatedCustomers = [...customers];
        updatedCustomers[customerIndex] = {
          ...existing,
          address: invoice.customerAddress,
          gstin: invoice.customerGSTIN,
          phone: invoice.customerPhone
        };
        StorageService.saveCustomers(updatedCustomers);
      }
    } else {
      const newCustomer: Customer = {
        id: Math.random().toString(36).substring(2, 11),
        name: invoice.customerName.trim(),
        address: invoice.customerAddress,
        gstin: invoice.customerGSTIN,
        phone: invoice.customerPhone
      };
      StorageService.saveCustomers([...customers, newCustomer]);
    }

    // Auto-save/update products in master
    const currentProducts = StorageService.getProducts();
    let productsUpdated = false;
    const newProductsList = [...currentProducts];

    invoice.items.forEach(item => {
      const normalizedItemName = item.name.trim().toLowerCase();
      const productExists = newProductsList.some(p => p.name.trim().toLowerCase() === normalizedItemName);
      
      if (!productExists) {
        newProductsList.push({
          id: Math.random().toString(36).substring(2, 11),
          name: item.name.trim(),
          unit: item.unit || 'unit',
          price: item.price,
          gstRate: item.gstRate || 0
        });
        productsUpdated = true;
      }
    });

    if (productsUpdated) {
      StorageService.saveProducts(newProductsList);
    }
  },
  getLastInvoice: (): Invoice | null => {
    const data = localStorage.getItem(KEYS.LAST_INVOICE);
    if (data) return JSON.parse(data);
    
    // If no last invoice, return the default sample one as a template
    return DEFAULT_INVOICE;
  }
};
