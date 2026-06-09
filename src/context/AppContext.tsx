import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product, Sale, User, ActiveView, Invoice, TaxRate } from '../types';
import { mockProducts, mockSales, mockUsers, mockInvoices, mockTaxRates } from '../data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  login: (id: string) => void;
  authenticate: (email: string, password: string) => Promise<boolean>;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  createProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (id: string, user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  createSale: (sale: { platform: Sale['platform']; products: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }>; employeeId: string }) => Promise<Sale>;
  createInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  createTaxRate: (rate: Omit<TaxRate, 'id' | 'active'>) => Promise<TaxRate>;
  updateTaxRate: (id: string, rate: Omit<TaxRate, 'id' | 'active'>) => Promise<TaxRate>;
  toggleTaxRate: (id: string) => Promise<TaxRate>;
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
  password: '',
  role: 'employee',
  active: false,
  createdAt: new Date().toISOString().split('T')[0],
};

const parseJsonResponse = async <T,>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as unknown as T;
  }
  return JSON.parse(text) as T;
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${url} (${response.status})`);
  }
  return parseJsonResponse<T>(response);
};

const sendJson = async <T, B>(url: string, method: string, body: B): Promise<T> => {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === null ? null : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${url} (${response.status})`);
  }
  return parseJsonResponse<T>(response);
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User>(guestUser);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, salesData, usersData, invoicesData, taxRatesData] = await Promise.all([
          fetchJson<Product[]>('/api/products'),
          fetchJson<Sale[]>('/api/sales'),
          fetchJson<User[]>('/api/users'),
          fetchJson<Invoice[]>('/api/invoices'),
          fetchJson<TaxRate[]>('/api/tax-rates'),
        ]);

        setProducts(productsData);
        setSales(salesData);
        setUsers(usersData);
        setInvoices(invoicesData);
        setTaxRates(taxRatesData);
      } catch (error) {
        console.warn('No se pudieron cargar los datos desde MySQL. Usando datos de prueba.', error);
        setProducts(mockProducts);
        setSales(mockSales);
        setUsers(mockUsers);
        setInvoices(mockInvoices);
        setTaxRates(mockTaxRates);
      }
    };

    loadData();
  }, []);

  const login = (id: string) => {
    const nextUser = users.find(u => u.id === id);
    if (nextUser) setCurrentUser(nextUser);
  };

  const sendJsonWithRole = async <T, B>(url: string, method: string, body: B): Promise<T> => {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
      },
      body: body === null ? null : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${url} (${response.status})`);
    }
    return parseJsonResponse<T>(response);
  };

  const authenticate = async (email: string, password: string) => {
    try {
      const user = await sendJson<User, { email: string; password: string }>('/api/auth/login', 'POST', {
        email,
        password,
      });
      setCurrentUser(user);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const addUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser = await sendJson<User, typeof user>('/api/users', 'POST', user);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const createProduct = async (product: Omit<Product, 'id'>) => {
    const created = await sendJson<Product, Omit<Product, 'id'>>('/api/products', 'POST', product);
    setProducts(prev => [...prev, created]);
    return created;
  };

  const updateProduct = async (id: string, product: Omit<Product, 'id'>) => {
    const updated = await sendJson<Product, Omit<Product, 'id'>>(`/api/products/${id}`, 'PUT', product);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deleteProduct = async (id: string) => {
    await sendJson<void, null>(`/api/products/${id}`, 'DELETE', null);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const createUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
    const created = await sendJsonWithRole<User, Omit<User, 'id' | 'createdAt'>>('/api/admin/users', 'POST', user);
    setUsers(prev => [...prev, created]);
    return created;
  };

  const updateUser = async (id: string, user: Omit<User, 'id' | 'createdAt'>) => {
    const updated = await sendJsonWithRole<User, Omit<User, 'id' | 'createdAt'>>(`/api/users/${id}`, 'PUT', user);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    if (currentUser.id === id) setCurrentUser(updated);
    return updated;
  };

  const deleteUser = async (id: string) => {
    await sendJsonWithRole<void, null>(`/api/users/${id}`, 'DELETE', null);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const createSale = async (sale: {
    platform: Sale['platform'];
    products: Sale['products'];
    employeeId: string;
  }) => {
    const created = await sendJson<Sale, typeof sale>('/api/sales', 'POST', sale);
    setSales(prev => [created, ...prev]);
    const refreshedProducts = await fetchJson<Product[]>('/api/products');
    setProducts(refreshedProducts);
    return created;
  };

  const createInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    const created = await sendJson<Invoice, Omit<Invoice, 'id'>>('/api/invoices', 'POST', invoice);
    setInvoices(prev => [created, ...prev]);
    return created;
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    await sendJson<void, { status: Invoice['status'] }>(`/api/invoices/${id}/status`, 'PATCH', { status });
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
  };

  const deleteInvoice = async (id: string) => {
    await sendJson<void, null>(`/api/invoices/${id}`, 'DELETE', null);
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const createTaxRate = async (rate: Omit<TaxRate, 'id' | 'active'>) => {
    const created = await sendJson<TaxRate, Omit<TaxRate, 'id' | 'active'>>('/api/tax-rates', 'POST', rate);
    setTaxRates(prev => [...prev, created]);
    return created;
  };

  const updateTaxRate = async (id: string, rate: Omit<TaxRate, 'id' | 'active'>) => {
    const updated = await sendJson<TaxRate, Omit<TaxRate, 'id' | 'active'>>(`/api/tax-rates/${id}`, 'PUT', rate);
    setTaxRates(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const toggleTaxRate = async (id: string) => {
    const updated = await sendJson<TaxRate, null>(`/api/tax-rates/${id}/active`, 'PATCH', null);
    setTaxRates(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const logout = () => setCurrentUser(guestUser);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, login, authenticate, addUser, logout, activeView, setActiveView,
      products, setProducts, sales, setSales, users, setUsers,
      invoices, setInvoices, taxRates, setTaxRates,
      createProduct, updateProduct, deleteProduct,
      createUser, updateUser, deleteUser,
      createSale, createInvoice, updateInvoiceStatus, deleteInvoice,
      createTaxRate, updateTaxRate, toggleTaxRate,
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
