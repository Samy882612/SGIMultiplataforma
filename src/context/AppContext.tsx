import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product, Sale, User, ActiveView, Invoice, TaxRate } from '../types';
import { mockProducts, mockSales, mockUsers, mockInvoices, mockTaxRates } from '../data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  login: (id: string) => void;
  authenticate: (email: string, password: string) => boolean;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  logout: () => void;
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  createProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  createSale: (sale: { platform: Sale['platform']; products: Sale['products']; employeeId: string }) => Promise<Sale>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  createInvoice: (invoice: Invoice) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  taxRates: TaxRate[];
  setTaxRates: React.Dispatch<React.SetStateAction<TaxRate[]>>;
  createTaxRate: (rate: Omit<TaxRate, 'id' | 'active'>) => Promise<TaxRate>;
  updateTaxRate: (id: string, rate: Omit<TaxRate, 'id' | 'active'>) => Promise<TaxRate>;
  toggleTaxRate: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const guestUser: User = {
  id: 'guest',
  name: 'Invitado',
  email: 'guest@sapposstore.com',
  password: '',
  role: 'employee',
  active: false,
  createdAt: new Date().toISOString().split('T')[0],
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [taxRates, setTaxRates] = useState<TaxRate[]>(mockTaxRates);

  const login = (id: string) => {
    const nextUser = users.find(u => u.id === id);
    if (nextUser) setCurrentUser(nextUser);
  };

  const authenticate = (email: string, password: string) => {
    const nextUser = users.find(u => u.email === email && u.password === password);
    if (!nextUser) return false;
    setCurrentUser(nextUser);
    return true;
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const id = `U${String(users.length + 1).padStart(3, '0')}`;
    const newUser: User = { id, ...user, createdAt: new Date().toISOString().split('T')[0] };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const logout = () => setCurrentUser(guestUser);

  const createProduct = async (product: Omit<Product, 'id'>) => {
    const id = `P${String(products.length + 1).padStart(3, '0')}`;
    const newProduct: Product = { id, ...product };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = async (id: string, product: Omit<Product, 'id'>) => {
    let updatedProduct: Product | null = null;
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        updatedProduct = { ...p, ...product };
        return updatedProduct;
      }
      return p;
    }));
    return updatedProduct ?? { id, ...product };
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const createSale = async (sale: { platform: Sale['platform']; products: Sale['products']; employeeId: string }) => {
    const id = `S${String(sales.length + 1).padStart(3, '0')}`;
    const receiptNumber = `RCPT-${String(sales.length + 1).padStart(4, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const total = sale.products.reduce((acc, item) => acc + item.subtotal, 0);
    const newSale: Sale = {
      id,
      date,
      platform: sale.platform,
      products: sale.products,
      total,
      status: 'completed',
      receiptNumber,
      employeeId: sale.employeeId,
    };
    setSales(prev => [...prev, newSale]);
    return newSale;
  };

  const createInvoice = async (invoice: Invoice) => {
    setInvoices(prev => [...prev, invoice]);
    return invoice;
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
  };

  const deleteInvoice = async (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const createTaxRate = async (rate: Omit<TaxRate, 'id' | 'active'>) => {
    const id = `T${String(taxRates.length + 1).padStart(3, '0')}`;
    const newRate: TaxRate = { id, active: true, ...rate };
    setTaxRates(prev => [...prev, newRate]);
    return newRate;
  };

  const updateTaxRate = async (id: string, rate: Omit<TaxRate, 'id' | 'active'>) => {
    let updatedRate: TaxRate | null = null;
    setTaxRates(prev => prev.map(t => {
      if (t.id === id) {
        updatedRate = { ...t, ...rate };
        return updatedRate;
      }
      return t;
    }));
    return updatedRate ?? { id, active: true, ...rate };
  };

  const toggleTaxRate = async (id: string) => {
    setTaxRates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, login, authenticate, addUser, logout, activeView, setActiveView,
      products, setProducts, createProduct, updateProduct, deleteProduct,
      sales, setSales, createSale,
      users, setUsers,
      invoices, setInvoices, createInvoice, updateInvoiceStatus, deleteInvoice,
      taxRates, setTaxRates, createTaxRate, updateTaxRate, toggleTaxRate,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
