import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product, Sale, User, ActiveView, Invoice, TaxRate, Platform } from '../types';
import { mockProducts, mockSales, mockUsers, mockInvoices, mockTaxRates, mockPlatforms } from '../data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  login: (id: string) => void;
  authenticate: (email: string, password: string) => Promise<boolean>;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (id: string, user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  logout: () => void;
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  createProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  platforms: Platform[];
  setPlatforms: React.Dispatch<React.SetStateAction<Platform[]>>;
  createPlatform: (platform: Omit<Platform, 'id'>) => Promise<Platform>;
  updatePlatform: (id: string, platform: Omit<Platform, 'id'>) => Promise<Platform>;
  deletePlatform: (id: string) => Promise<void>;
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
  const [platforms, setPlatforms] = useState<Platform[]>(mockPlatforms);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [taxRates, setTaxRates] = useState<TaxRate[]>(mockTaxRates);

  // Cargar datos de la API al iniciar
  useEffect(() => {
    const loadData = async () => {
      // Intentar cargar desde localStorage primero (persistencia local)
      try {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsers(parsed);
            setCurrentUser(parsed[0]);
          }
        }
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
          const parsedP = JSON.parse(storedProducts);
          if (Array.isArray(parsedP) && parsedP.length > 0) setProducts(parsedP);
        }
        const storedPlatforms = localStorage.getItem('platforms');
        if (storedPlatforms) {
          const parsedPl = JSON.parse(storedPlatforms);
          if (Array.isArray(parsedPl) && parsedPl.length > 0) setPlatforms(parsedPl);
        }
      } catch (e) {
        // ignore localStorage parse errors
      }
      try {
        const [productsRes, usersRes, taxRatesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/users'),
          fetch('/api/tax-rates'),
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          if (Array.isArray(productsData) && productsData.length > 0) {
            setProducts(productsData);
          }
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (Array.isArray(usersData) && usersData.length > 0) {
            setUsers(usersData);
            setCurrentUser(usersData[0]);
          }
        }

        if (taxRatesRes.ok) {
          const taxRatesData = await taxRatesRes.json();
          if (Array.isArray(taxRatesData) && taxRatesData.length > 0) {
            setTaxRates(taxRatesData);
          }
        }

        const platformsRes = await fetch('/api/platforms');
        if (platformsRes.ok) {
          const platformsData = await platformsRes.json();
          if (Array.isArray(platformsData) && platformsData.length > 0) {
            setPlatforms(platformsData);
          }
        }
      } catch (error) {
        console.error('Error loading data from API:', error);
        // Mantener los mockData si la API no está disponible
      }
    };

    loadData();
  }, []);

  // Persistir cambios locales en localStorage para users y products
  useEffect(() => {
    try {
      localStorage.setItem('users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users to localStorage', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('products', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to persist products to localStorage', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('platforms', JSON.stringify(platforms));
    } catch (e) {
      console.error('Failed to persist platforms to localStorage', e);
    }
  }, [platforms]);

  const login = (id: string) => {
    const nextUser = users.find(u => u.id === id);
    if (nextUser) setCurrentUser(nextUser);
  };

  const authenticate = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const user: User = await res.json();
      setCurrentUser(user);
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      // Fallback a autenticación local
      const nextUser = users.find(u => u.email === email && u.password === password);
      if (!nextUser) return false;
      setCurrentUser(nextUser);
      return true;
    }
  };

  const addUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role.toLowerCase(),
        },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error('Failed to create user');
      const newUser: User = await res.json();
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (error) {
      console.error('Create user error:', error);
      // Fallback: crear localmente
      const id = `U${String(users.length + 1).padStart(3, '0')}`;
      const newUser: User = { id, ...user, createdAt: new Date().toISOString().split('T')[0] };
      setUsers(prev => [...prev, newUser]);
      return newUser;
    }
  };

  const updateUser = async (id: string, user: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role.toLowerCase(),
        },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error('Failed to update user');
      const updatedUser: User = await res.json();
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      if (currentUser.id === id) setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update user error:', error);
      const existingUser = users.find(u => u.id === id);
      const updatedUser: User = {
        id,
        ...user,
        createdAt: existingUser?.createdAt ?? new Date().toISOString().split('T')[0],
      };
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      if (currentUser.id === id) setCurrentUser(updatedUser);
      return updatedUser;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser.role.toLowerCase(),
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  };

  const logout = () => setCurrentUser(guestUser);

  const createProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error('Failed to create product');
      const newProduct: Product = await res.json();
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Create product error:', error);
      const id = `P${String(products.length + 1).padStart(3, '0')}`;
      const fallbackProduct: Product = { id, ...product };
      setProducts(prev => [...prev, fallbackProduct]);
      return fallbackProduct;
    }
  };

  const updateProduct = async (id: string, product: Omit<Product, 'id'>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error('Failed to update product');
      const updatedProduct: Product = await res.json();
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;
    } catch (error) {
      console.error('Update product error:', error);
      const updatedProduct: Product = { id, ...product };
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete product error:', error);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const createPlatform = async (platform: Omit<Platform, 'id'>) => {
    try {
      const res = await fetch('/api/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platform),
      });
      if (!res.ok) throw new Error('Failed to create platform');
      const newPlatform: Platform = await res.json();
      setPlatforms(prev => [...prev, newPlatform]);
      return newPlatform;
    } catch (error) {
      console.error('Create platform error:', error);
      const nextId = platforms
        .map(p => Number(p.id.replace(/^PL/, '')))
        .filter(Number.isFinite)
        .sort((a, b) => b - a)[0] || 0;
      const newPlatform: Platform = {
        id: `PL${String(nextId + 1).padStart(3, '0')}`,
        ...platform,
      };
      setPlatforms(prev => [...prev, newPlatform]);
      return newPlatform;
    }
  };

  const updatePlatform = async (id: string, platform: Omit<Platform, 'id'>) => {
    try {
      const res = await fetch(`/api/platforms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platform),
      });
      if (!res.ok) throw new Error('Failed to update platform');
      const updatedPlatform: Platform = await res.json();
      setPlatforms(prev => prev.map(p => p.id === id ? updatedPlatform : p));
      return updatedPlatform;
    } catch (error) {
      console.error('Update platform error:', error);
      const updatedPlatform: Platform = { id, ...platform };
      setPlatforms(prev => prev.map(p => p.id === id ? updatedPlatform : p));
      return updatedPlatform;
    }
  };

  const deletePlatform = async (id: string) => {
    try {
      const res = await fetch(`/api/platforms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete platform');
      setPlatforms(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete platform error:', error);
      setPlatforms(prev => prev.filter(p => p.id !== id));
    }
  };

  const createSale = async (sale: { platform: Sale['platform']; products: Sale['products']; employeeId: string }) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale),
      });
      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new Error(`Failed to create sale: ${res.status} ${errorBody}`);
      }
      const newSale: Sale = await res.json();
      setSales(prev => [...prev, newSale]);
      return newSale;
    } catch (error) {
      console.error('Create sale error:', error);
      const nextSaleNumber = sales
        .map(s => Number(s.id.replace(/^V/, '')))
        .filter(Number.isFinite)
        .sort((a, b) => b - a)[0] || 0;
      const newId = `V${String(nextSaleNumber + 1).padStart(3, '0')}`;
      const newSale: Sale = {
        id: newId,
        date: new Date().toISOString().split('T')[0],
        products: sale.products,
        total: sale.products.reduce((sum, item) => sum + item.subtotal, 0),
        platform: sale.platform,
        status: 'completed',
        receiptNumber: `REC-${String(nextSaleNumber + 1).padStart(3, '0')}`,
        employeeId: sale.employeeId,
      };
      setSales(prev => [...prev, newSale]);
      setProducts(prev => prev.map(product => {
        const saleItem = sale.products.find(item => item.productId === product.id);
        if (!saleItem) return product;
        return { ...product, quantity: product.quantity - saleItem.quantity };
      }));
      return newSale;
    }
  };

  const createInvoice = async (invoice: Invoice) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    if (!res.ok) throw new Error('Failed to create invoice');
    const newInvoice: Invoice = await res.json();
    setInvoices(prev => [...prev, newInvoice]);
    return newInvoice;
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update invoice');
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
  };

  const deleteInvoice = async (id: string) => {
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete invoice');
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const createTaxRate = async (rate: Omit<TaxRate, 'id' | 'active'>) => {
    const res = await fetch('/api/tax-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rate),
    });
    if (!res.ok) throw new Error('Failed to create tax rate');
    const newRate: TaxRate = await res.json();
    setTaxRates(prev => [...prev, newRate]);
    return newRate;
  };

  const updateTaxRate = async (id: string, rate: Omit<TaxRate, 'id' | 'active'>) => {
    const res = await fetch(`/api/tax-rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rate),
    });
    if (!res.ok) throw new Error('Failed to update tax rate');
    const updatedRate: TaxRate = await res.json();
    setTaxRates(prev => prev.map(t => t.id === id ? updatedRate : t));
    return updatedRate;
  };

  const toggleTaxRate = async (id: string) => {
    const res = await fetch(`/api/tax-rates/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to toggle tax rate');
    setTaxRates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, login, authenticate, addUser, deleteUser, logout, activeView, setActiveView,
      products, setProducts, createProduct, updateProduct, deleteProduct,
      sales, setSales, createSale,
      users, setUsers, updateUser,
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
