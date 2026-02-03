
export interface UserProfile {
  businessName: string;
  address: string;
  gstin: string;      
  pan?: string; 
  phone: string;
  email: string;
  logoUrl?: string;
  currency: string;    
  currencySymbol: string; 
  // Tax Settings
  taxEnabled: boolean;
  defaultTaxRate: number;
  isTaxInclusive: boolean;
  state: string;    
  // Invoice Settings
  invoicePrefix: string;
  nextNumber: number;
  availableUnits: string[]; 
  // Bank Details
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string; 
  upiId?: string;       
  // Terms
  termsAndConditions?: string;
  signatureTitle?: string;
}

export interface Product {
  id: string;
  name: string;
  hsnCode?: string;
  unit: string;
  price: number;
  taxRate: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  gstin?: string;
  phone?: string;
  state?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  hsnCode?: string;
  quantity: number;
  price: number;
  unit: string;
  taxRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerGstin?: string;
  customerPhone?: string;
  customerState?: string;
  items: InvoiceItem[];
  subTotal: number;
  totalTax: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Paid';
  createdAt: number;
  taxEnabled: boolean;
  currencySymbol: string;
}

export type View = 'invoice' | 'history' | 'products' | 'customers' | 'profile' | 'login';
