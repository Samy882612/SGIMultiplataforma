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
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  taxRates: TaxRate[];
  setTaxRates: React.Dispatch<React.SetStateAction<TaxRate[]>>;
}

const AppContext = createContext<AppContextType | null>(null);

const guestUser: User = {
  id: 'guest',
  name: 'Invitado',
  email: 'guest@sapposstore.com',
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

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, login, authenticate, addUser, logout, activeView, setActiveView,
      products, setProducts, sales, setSales, users, setUsers,
      invoices, setInvoices, taxRates, setTaxRates,
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
