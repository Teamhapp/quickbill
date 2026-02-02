
export interface UserProfile {
  businessName: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
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
