
export interface UserProfile {
  businessName: string;
  ownerName?: string;
  address: string;
  gstin: string;
  pan?: string;
  phone: string;
  email: string;
  logoUrl?: string;
  // GST Settings
  gstEnabled: boolean;
  defaultGstRate: number;
  isGstInclusive: boolean;
  // Invoice Settings
  invoicePrefix: string;
  nextNumber: number;
  // Bank Details
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  // Terms
  termsAndConditions?: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  gstRate: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  gstin?: string;
  phone?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  gstRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerGSTIN?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subTotal: number;
  totalGst: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Paid';
  createdAt: number;
}

export type View = 'invoice' | 'history' | 'products' | 'customers' | 'profile' | 'login';
