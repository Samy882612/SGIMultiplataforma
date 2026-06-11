export interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
  quantity: number;
  category: string;
  sku: string;
  minStock: number;
}

export interface Sale {
  id: string;
  date: string;
  products: SaleItem[];
  total: number;
  platform: 'local' | 'mercadolibre' | 'falabella';
  status: 'completed' | 'returned' | 'pending';
  receiptNumber: string;
  employeeId: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Platform {
  id: string;
  name: string;
  logo: string;
  apiKey: string;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync: string;
  products: number;
  sales: number;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  active: boolean;
  createdAt: string;
}

export interface Report {
  period: string;
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  returns: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  description: string;
  active: boolean;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRateId: string;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'overdue';

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientId: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  totalTax: number;
  total: number;
  status: InvoiceStatus;
  notes: string;
  createdBy: string;
}

export type ActiveView =
  | 'dashboard'
  | 'inventory'
  | 'sales'
  | 'reports'
  | 'platforms'
  | 'users'
  | 'billing'
  | 'login';
