import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "sapposstore",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const formatDate = value => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().split("T")[0] : value;
};

let dbAvailable = true;
const fallbackUsers = [
  {
    id: 'U001',
    name: 'Sandra Zapata',
    email: 'admin@sapposstore.com',
    password: 'admin123',
    role: 'admin',
    active: true,
    createdAt: '2024-01-01',
  },
];

const getNextFallbackUserId = () => {
  const ids = fallbackUsers.map(u => Number(u.id.replace(/^U0*/, ''))).filter(Boolean);
  const next = ids.length ? Math.max(...ids) + 1 : 1;
  return `U${String(next).padStart(3, '0')}`;
};

const findFallbackUserByEmail = email => fallbackUsers.find(u => u.email === email);
const findFallbackUserById = id => fallbackUsers.find(u => u.id === id);
const createFallbackUser = user => {
  const newUser = { ...user, id: getNextFallbackUserId(), createdAt: new Date().toISOString().split('T')[0] };
  fallbackUsers.push(newUser);
  return newUser;
};

const fallbackPlatforms = [
  { id: 'PL001', name: 'MercadoLibre', logo: 'ML', apiKey: 'ml-demo-key', status: 'connected', lastSync: '2024-06-03 10:32', products: 45, sales: 128, color: 'bg-yellow-400' },
  { id: 'PL002', name: 'Falabella', logo: 'FA', apiKey: 'fb-demo-key', status: 'connected', lastSync: '2024-06-03 09:15', products: 32, sales: 67, color: 'bg-green-500' },
  { id: 'PL003', name: 'Exito', logo: 'EX', status: 'disconnected', lastSync: 'N/A', products: 0, sales: 0, color: 'bg-orange-500' },
];

const getNextFallbackPlatformId = () => {
  const ids = fallbackPlatforms
    .map(p => parseId(p.id, 'PL'))
    .filter(Number.isFinite);
  const next = ids.length ? Math.max(...ids) + 1 : 1;
  return `PL${String(next).padStart(3, '0')}`;
};

const findFallbackPlatformById = id => fallbackPlatforms.find(p => p.id === id);
const createFallbackPlatform = platform => {
  const newPlatform = { ...platform, id: getNextFallbackPlatformId() };
  fallbackPlatforms.push(newPlatform);
  return newPlatform;
};
const updateFallbackPlatform = (id, changes) => {
  const platform = findFallbackPlatformById(id);
  if (!platform) return null;
  Object.assign(platform, changes);
  return platform;
};
const deleteFallbackPlatform = id => {
  const index = fallbackPlatforms.findIndex(p => p.id === id);
  if (index < 0) return false;
  fallbackPlatforms.splice(index, 1);
  return true;
};

const formatPlatformRow = row => ({
  id: `PL${String(row.id_plataforma).padStart(3, '0')}`,
  name: row.nombre,
  logo: row.logo,
  apiKey: row.api_key || '',
  status: row.estado || 'disconnected',
  lastSync: row.ultimo_sync ? formatDate(row.ultimo_sync) : 'N/A',
  products: Number(row.productos || 0),
  sales: Number(row.ventas || 0),
  color: row.color || 'bg-slate-500',
});

const mapSaleItems = (sales, items) => {
  const salesMap = new Map();
  sales.forEach(sale => {
    salesMap.set(sale.id, { ...sale, products: [] });
  });

  items.forEach(item => {
    const sale = salesMap.get(item.id_venta);
    if (!sale) return;
    sale.products.push({
      productId: `P${String(item.id_producto).padStart(3, "0")}`,
      productName: item.product_name,
      quantity: Number(item.cantidad),
      unitPrice: Number(item.precio_unitario),
      subtotal: Number(item.subtotal),
    });
  });

  return Array.from(salesMap.values());
};

const mapInvoiceItems = (invoices, items) => {
  const invoiceMap = new Map();
  invoices.forEach(invoice => {
    invoiceMap.set(invoice.saleId, { ...invoice, items: [] });
  });

  items.forEach(item => {
    const invoice = invoiceMap.get(item.id_venta);
    if (!invoice) return;
    invoice.items.push({
      productId: `P${String(item.id_producto).padStart(3, "0")}`,
      productName: item.product_name,
      quantity: Number(item.cantidad),
      unitPrice: Number(item.precio_unitario),
      taxRateId: null,
      taxAmount: 0,
      subtotal: Number(item.subtotal),
      total: Number(item.subtotal),
    });
  });

  return Array.from(invoiceMap.values());
};

const parseId = (value, prefix) => {
  if (!value) return null;
  const numeric = String(value).replace(prefix, '').replace(/^0+/, '');
  return numeric ? Number(numeric) : null;
};

const getHeaderRole = (req) => {
  const rawRole = req.headers['x-user-role'];
  if (Array.isArray(rawRole)) return rawRole[0]?.toString().toLowerCase() || '';
  return String(rawRole || '').toLowerCase();
};

const requireAdmin = (req, res) => {
  if (getHeaderRole(req) !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    return false;
  }
  return true;
};

const hasAdminUser = async () => {
  if (!dbAvailable) return fallbackUsers.some(u => u.role === 'admin');

  const [rows] = await pool.query(
    'SELECT COUNT(*) AS count FROM usuarios u LEFT JOIN rol r ON u.`id-rol` = r.id_rol WHERE r.nombre = ?',
    ['admin']
  );
  return rows[0].count > 0;
};

const getCategoryId = async (categoryName) => {
  if (!categoryName) return null;
  const [rows] = await pool.query('SELECT id_categoria FROM categoria WHERE nombre = ?', [categoryName]);
  if (rows.length > 0) return rows[0].id_categoria;
  const [result] = await pool.query('INSERT INTO categoria (nombre) VALUES (?)', [categoryName]);
  return result.insertId;
};

const getRoleId = async (roleName) => {
  if (!roleName) return null;
  const [rows] = await pool.query('SELECT id_rol FROM rol WHERE nombre = ?', [roleName]);
  if (rows.length > 0) return rows[0].id_rol;
  const [result] = await pool.query('INSERT INTO rol (nombre) VALUES (?)', [roleName]);
  return result.insertId;
};

const getClientId = async (name, email) => {
  if (!name && !email) return null;
  const [rows] = await pool.query('SELECT id_clientes FROM clientes WHERE email = ? LIMIT 1', [email]);
  if (rows.length > 0) return rows[0].id_clientes;
  const [result] = await pool.query('INSERT INTO clientes (nombre, email) VALUES (?, ?)', [name || 'Cliente', email || null]);
  return result.insertId;
};

const ensurePlatformsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plataformas (
      id_plataforma INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      logo VARCHAR(20) NOT NULL,
      api_key TEXT,
      estado ENUM('connected','disconnected','syncing') NOT NULL DEFAULT 'disconnected',
      ultimo_sync DATETIME NULL,
      productos INT NOT NULL DEFAULT 0,
      ventas INT NOT NULL DEFAULT 0,
      color VARCHAR(30) NOT NULL DEFAULT 'bg-slate-500',
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const taxRatesFallback = [
  { id: 'T001', name: 'IVA 19%', rate: 19, description: 'Impuesto al Valor Agregado general', active: true },
  { id: 'T002', name: 'IVA 5%', rate: 5, description: 'IVA reducido para bienes básicos', active: true },
  { id: 'T003', name: 'Exento (0%)', rate: 0, description: 'Bienes y servicios exentos de IVA', active: true },
];

const selectTaxRates = async () => {
  try {
    const [rows] = await pool.query('SELECT id, name, rate, description, active FROM tax_rates');
    return rows;
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return taxRatesFallback;
    throw error;
  }
};

app.get("/api/products", async (req, res) => {
  try {
    if (!dbAvailable) return res.json([]);
    const [rows] = await pool.query(
      'SELECT p.id_producto, p.nombre, p.`descripcion TEXT,` AS descripcion, p.precio_compra, p.precio_venta, p.stock, p.stock_minimo, c.nombre AS categoria FROM productos p LEFT JOIN categoria c ON p.id_categoria = c.id_categoria'
    );

    const products = rows.map(row => ({
      id: `P${String(row.id_producto).padStart(3, "0")}`,
      name: row.nombre,
      cost: Number(row.precio_compra),
      price: Number(row.precio_venta),
      quantity: Number(row.stock),
      category: row.categoria || "Sin categoría",
      sku: `SKU-${String(row.id_producto).padStart(4, "0")}`,
      minStock: Number(row.stock_minimo),
    }));

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    if (!dbAvailable) return res.json(fallbackUsers);

    const [rows] = await pool.query(
      'SELECT u.id_usuarios, u.nombre, u.email, u.password, r.nombre AS role, u.estado, u.fecha_creacion FROM usuarios u LEFT JOIN rol r ON u.`id-rol` = r.id_rol'
    );

    const users = rows.map(row => ({
      id: `U${String(row.id_usuarios).padStart(3, "0")}`,
      name: row.nombre,
      email: row.email,
      password: row.password,
      role: row.role || "employee",
      active: Number(row.estado) === 1,
      createdAt: formatDate(row.fecha_creacion),
    }));

    res.json(users);
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      return res.json(fallbackUsers);
    }
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.get("/api/tax-rates", async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, rate, description, active FROM tax_rates');
    if (rows.length > 0) {
      return res.json(rows);
    }
  } catch (error) {
    if (error.code !== "ER_NO_SUCH_TABLE") {
      console.error(error);
      return res.status(500).json({ error: "Error al obtener tarifas de impuesto" });
    }
  }

  res.json([
    { id: "T001", name: "IVA 19%", rate: 19, description: "Impuesto al Valor Agregado general", active: true },
    { id: "T002", name: "IVA 5%", rate: 5, description: "IVA reducido para bienes básicos", active: true },
    { id: "T003", name: "Exento (0%)", rate: 0, description: "Bienes y servicios exentos de IVA", active: true },
  ]);
});

app.get('/api/platforms', async (req, res) => {
  try {
    if (!dbAvailable) return res.json(fallbackPlatforms);

    const [rows] = await pool.query(
      'SELECT id_plataforma, nombre, logo, api_key, estado, ultimo_sync, productos, ventas, color FROM plataformas ORDER BY id_plataforma DESC'
    );
    res.json(rows.map(formatPlatformRow));
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      try {
        await ensurePlatformsTable();
      } catch (createError) {
        console.error(createError);
      }
      return res.json(fallbackPlatforms);
    }

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      return res.json(fallbackPlatforms);
    }

    console.error(error);
    res.status(500).json({ error: 'Error al obtener plataformas' });
  }
});

app.post('/api/platforms', async (req, res) => {
  try {
    const { name, logo, apiKey, status, lastSync, products = 0, sales = 0, color } = req.body;
    if (!name || !logo) {
      return res.status(400).json({ error: 'Datos de plataforma inválidos' });
    }

    if (!dbAvailable) {
      const created = createFallbackPlatform({
        name,
        logo,
        apiKey: apiKey || '',
        status: status || 'disconnected',
        lastSync: lastSync || 'N/A',
        products: Number(products) || 0,
        sales: Number(sales) || 0,
        color: color || 'bg-slate-500',
      });
      return res.json(created);
    }

    const lastSyncValue = lastSync && lastSync !== 'N/A' ? new Date(lastSync) : null;
    const [result] = await pool.query(
      'INSERT INTO plataformas (nombre, logo, api_key, estado, ultimo_sync, productos, ventas, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, logo, apiKey || null, status || 'disconnected', lastSyncValue, Number(products) || 0, Number(sales) || 0, color || 'bg-slate-500']
    );
    const [rows] = await pool.query(
      'SELECT id_plataforma, nombre, logo, api_key, estado, ultimo_sync, productos, ventas, color FROM plataformas WHERE id_plataforma = ?',
      [result.insertId]
    );
    res.json(formatPlatformRow(rows[0]));
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      const created = createFallbackPlatform({
        name: req.body.name,
        logo: req.body.logo,
        apiKey: req.body.apiKey || '',
        status: req.body.status || 'disconnected',
        lastSync: req.body.lastSync || 'N/A',
        products: Number(req.body.products) || 0,
        sales: Number(req.body.sales) || 0,
        color: req.body.color || 'bg-slate-500',
      });
      return res.json(created);
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear plataforma' });
  }
});

app.put('/api/platforms/:id', async (req, res) => {
  try {
    const platformId = parseId(req.params.id, 'PL');
    if (!platformId) return res.status(400).json({ error: 'Plataforma inválida' });
    const { name, logo, apiKey, status, lastSync, products = 0, sales = 0, color } = req.body;

    if (!dbAvailable) {
      const updated = updateFallbackPlatform(req.params.id, {
        name,
        logo,
        apiKey: apiKey || '',
        status: status || 'disconnected',
        lastSync: lastSync || 'N/A',
        products: Number(products) || 0,
        sales: Number(sales) || 0,
        color: color || 'bg-slate-500',
      });
      if (!updated) return res.status(404).json({ error: 'Plataforma no encontrada' });
      return res.json(updated);
    }

    const lastSyncValue = lastSync && lastSync !== 'N/A' ? new Date(lastSync) : null;
    await pool.query(
      'UPDATE plataformas SET nombre = ?, logo = ?, api_key = ?, estado = ?, ultimo_sync = ?, productos = ?, ventas = ?, color = ? WHERE id_plataforma = ?',
      [name, logo, apiKey || null, status || 'disconnected', lastSyncValue, Number(products) || 0, Number(sales) || 0, color || 'bg-slate-500', platformId]
    );
    const [rows] = await pool.query(
      'SELECT id_plataforma, nombre, logo, api_key, estado, ultimo_sync, productos, ventas, color FROM plataformas WHERE id_plataforma = ?',
      [platformId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Plataforma no encontrada' });
    res.json(formatPlatformRow(rows[0]));
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      const updated = updateFallbackPlatform(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Plataforma no encontrada' });
      return res.json(updated);
    }
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar plataforma' });
  }
});

app.delete('/api/platforms/:id', async (req, res) => {
  try {
    const platformId = parseId(req.params.id, 'PL');
    if (!platformId) return res.status(400).json({ error: 'Plataforma inválida' });

    if (!dbAvailable) {
      const deleted = deleteFallbackPlatform(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Plataforma no encontrada' });
      return res.status(204).send();
    }

    await pool.query('DELETE FROM plataformas WHERE id_plataforma = ?', [platformId]);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      const deleted = deleteFallbackPlatform(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Plataforma no encontrada' });
      return res.status(204).send();
    }
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar plataforma' });
  }
});

app.get("/api/sales", async (req, res) => {
  try {
    const [sales] = await pool.query('SELECT id_ventas, id_usuario, fecha, total, estado FROM ventas');
    const [items] = await pool.query(
      'SELECT d.id_venta, d.id_producto, p.nombre AS product_name, d.cantidad, d.precio_unitario, (d.cantidad * d.precio_unitario) AS subtotal FROM detalle_venta d LEFT JOIN productos p ON d.id_producto = p.id_producto'
    );

    const formattedSales = sales.map(sale => ({
      id: `V${String(sale.id_ventas).padStart(3, "0")}`,
      date: formatDate(sale.fecha),
      total: Number(sale.total),
      platform: "local",
      status: sale.estado || "completed",
      receiptNumber: `REC-${String(sale.id_ventas).padStart(3, "0")}`,
      employeeId: `U${String(sale.id_usuario).padStart(3, "0")}`,
    }));

    res.json(mapSaleItems(formattedSales, items));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

app.get("/api/invoices", async (req, res) => {
  try {
    const [invoices] = await pool.query(
      'SELECT f.id_factura, f.numero_factura, f.fecha, f.impuestos, f.total, f.estado, v.id_ventas, v.id_cliente, v.id_usuario, c.nombre AS client_name, c.email AS client_email FROM facturacion f LEFT JOIN ventas v ON f.id_ventas = v.id_ventas LEFT JOIN clientes c ON v.id_cliente = c.id_clientes'
    );
    const [items] = await pool.query(
      'SELECT d.id_venta, d.id_producto, p.nombre AS product_name, d.cantidad, d.precio_unitario, (d.cantidad * d.precio_unitario) AS subtotal FROM detalle_venta d LEFT JOIN productos p ON d.id_producto = p.id_producto'
    );

    const formattedInvoices = invoices.map(inv => ({
      id: `INV${String(inv.id_factura).padStart(3, "0")}`,
      number: inv.numero_factura,
      date: formatDate(inv.fecha),
      dueDate: formatDate(new Date(new Date(inv.fecha).setDate(new Date(inv.fecha).getDate() + 15))),
      clientName: inv.client_name || "Cliente desconocido",
      clientId: `C${String(inv.id_cliente).padStart(3, "0")}`,
      clientEmail: inv.client_email || "",
      subtotal: Number(inv.total) - Number(inv.impuestos || 0),
      totalTax: Number(inv.impuestos || 0),
      total: Number(inv.total),
      status: inv.estado || "issued",
      notes: "",
      createdBy: `U${String(inv.id_usuario).padStart(3, "0")}`,
      saleId: inv.id_ventas,
    }));

    const result = mapInvoiceItems(formattedInvoices, items).map(invoice => {
      const { saleId, ...rest } = invoice;
      return rest;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener facturas" });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, cost, price, quantity, category, sku, minStock } = req.body;
    const categoryId = await getCategoryId(category);
    const [result] = await pool.query(
      'INSERT INTO productos (nombre, `descripcion TEXT,`, precio_compra, precio_venta, stock, stock_minimo, id_categoria, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, '', cost, price, quantity, minStock, categoryId]
    );
    const [rows] = await pool.query(
      'SELECT p.id_producto, p.nombre, p.precio_compra, p.precio_venta, p.stock, p.stock_minimo, c.nombre AS categoria FROM productos p LEFT JOIN categoria c ON p.id_categoria = c.id_categoria WHERE p.id_producto = ?',
      [result.insertId]
    );
    const row = rows[0];
    res.json({
      id: `P${String(row.id_producto).padStart(3, '0')}`,
      name: row.nombre,
      cost: Number(row.precio_compra),
      price: Number(row.precio_venta),
      quantity: Number(row.stock),
      category: row.categoria || category || 'Sin categoría',
      sku,
      minStock: Number(row.stock_minimo),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = parseId(req.params.id, 'P');
    if (!productId) return res.status(400).json({ error: 'Producto inválido' });
    const { name, cost, price, quantity, category, sku, minStock } = req.body;
    const categoryId = await getCategoryId(category);
    await pool.query(
      'UPDATE productos SET nombre = ?, `descripcion TEXT,` = ?, precio_compra = ?, precio_venta = ?, stock = ?, stock_minimo = ?, id_categoria = ? WHERE id_producto = ?',
      [name, '', cost, price, quantity, minStock, categoryId, productId]
    );
    const [rows] = await pool.query(
      'SELECT p.id_producto, p.nombre, p.precio_compra, p.precio_venta, p.stock, p.stock_minimo, c.nombre AS categoria FROM productos p LEFT JOIN categoria c ON p.id_categoria = c.id_categoria WHERE p.id_producto = ?',
      [productId]
    );
    const row = rows[0];
    res.json({
      id: `P${String(row.id_producto).padStart(3, '0')}`,
      name: row.nombre,
      cost: Number(row.precio_compra),
      price: Number(row.precio_venta),
      quantity: Number(row.stock),
      category: row.categoria || category || 'Sin categoría',
      sku,
      minStock: Number(row.stock_minimo),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = parseId(req.params.id, 'P');
    if (!productId) return res.status(400).json({ error: 'Producto inválido' });
    await pool.query('DELETE FROM productos WHERE id_producto = ?', [productId]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role = 'employee', active } = req.body;
    const isAdmin = role === 'admin';
    const adminExists = await hasAdminUser();

    if (isAdmin && adminExists) {
      return res.status(403).json({ error: 'Ya existe un administrador. Solo los administradores pueden crear otro admin.' });
    }

    if (!dbAvailable) {
      const created = createFallbackUser({ name, email, password, role, active });
      return res.json(created);
    }

    const roleId = await getRoleId(role);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, `id-rol`, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, email, password, roleId, active ? 1 : 0]
    );
    const users = await pool.query(
      'SELECT u.id_usuarios, u.nombre, u.email, u.password, r.nombre AS role, u.estado, u.fecha_creacion FROM usuarios u LEFT JOIN rol r ON u.`id-rol` = r.id_rol WHERE u.id_usuarios = ?',
      [result.insertId]
    );
    const row = users[0][0];
    res.json({
      id: `U${String(row.id_usuarios).padStart(3, '0')}`,
      name: row.nombre,
      email: row.email,
      password: row.password,
      role: row.role || 'employee',
      active: Number(row.estado) === 1,
      createdAt: formatDate(row.fecha_creacion),
    });
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      const created = createFallbackUser(req.body);
      return res.json(created);
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

app.post('/api/admin/users', async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { name, email, password, role, active } = req.body;
    if (!dbAvailable) {
      const created = createFallbackUser({ name, email, password, role, active });
      return res.json(created);
    }

    const roleId = await getRoleId(role);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, `id-rol`, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, email, password, roleId, active ? 1 : 0]
    );
    const [rows] = await pool.query(
      'SELECT u.id_usuarios, u.nombre, u.email, u.password, r.nombre AS role, u.estado, u.fecha_creacion FROM usuarios u LEFT JOIN rol r ON u.`id-rol` = r.id_rol WHERE u.id_usuarios = ?',
      [result.insertId]
    );
    const row = rows[0];
    res.json({
      id: `U${String(row.id_usuarios).padStart(3, '0')}`,
      name: row.nombre,
      email: row.email,
      password: row.password,
      role: row.role || 'employee',
      active: Number(row.estado) === 1,
      createdAt: formatDate(row.fecha_creacion),
    });
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      const created = createFallbackUser(req.body);
      return res.json(created);
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    if (!dbAvailable) {
      const user = findFallbackUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
      return res.json(user);
    }

    const [rows] = await pool.query(
      'SELECT u.id_usuarios, u.nombre, u.email, u.password, r.nombre AS role, u.estado, u.fecha_creacion FROM usuarios u LEFT JOIN rol r ON u.`id-rol` = r.id_rol WHERE u.email = ? AND u.password = ?',
      [email, password]
    );
    const row = rows[0];
    if (!row) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    res.json({
      id: `U${String(row.id_usuarios).padStart(3, '0')}`,
      name: row.nombre,
      email: row.email,
      password: row.password,
      role: row.role || 'employee',
      active: Number(row.estado) === 1,
      createdAt: formatDate(row.fecha_creacion),
    });
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      const user = findFallbackUserByEmail(req.body.email);
      if (!user || user.password !== req.body.password) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
      return res.json(user);
    }
    console.error(error);
    res.status(500).json({ error: 'Error al autenticar usuario' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const userId = parseId(req.params.id, 'U');
    if (!userId) return res.status(400).json({ error: 'Usuario inválido' });
    const { name, email, password, role, active } = req.body;

    if (!dbAvailable) {
      const id = `U${String(userId).padStart(3, '0')}`;
      const user = findFallbackUserById(id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      Object.assign(user, { name, email, password, role, active });
      return res.json(user);
    }

    const roleId = await getRoleId(role);
    await pool.query(
      'UPDATE usuarios SET nombre = ?, email = ?, password = ?, `id-rol` = ?, estado = ? WHERE id_usuarios = ?',
      [name, email, password, roleId, active ? 1 : 0, userId]
    );
    const [rows] = await pool.query(
      'SELECT u.id_usuarios, u.nombre, u.email, u.password, r.nombre AS role, u.estado, u.fecha_creacion FROM usuarios u LEFT JOIN rol r ON u.`id-rol` = r.id_rol WHERE u.id_usuarios = ?',
      [userId]
    );
    const row = rows[0];
    res.json({
      id: `U${String(row.id_usuarios).padStart(3, '0')}`,
      name: row.nombre,
      email: row.email,
      password: row.password,
      role: row.role || 'employee',
      active: Number(row.estado) === 1,
      createdAt: formatDate(row.fecha_creacion),
    });
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      const id = `U${String(parseId(req.params.id, 'U') || 0).padStart(3, '0')}`;
      const user = findFallbackUserById(id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      Object.assign(user, req.body);
      return res.json(user);
    }
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const userId = parseId(req.params.id, 'U');
    if (!userId) return res.status(400).json({ error: 'Usuario inválido' });

    if (!dbAvailable) {
      const id = `U${String(userId).padStart(3, '0')}`;
      const index = fallbackUsers.findIndex(u => u.id === id);
      if (index < 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      fallbackUsers.splice(index, 1);
      return res.status(204).send();
    }

    await pool.query('DELETE FROM usuarios WHERE id_usuarios = ?', [userId]);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      dbAvailable = false;
      const id = `U${String(parseId(req.params.id, 'U') || 0).padStart(3, '0')}`;
      const index = fallbackUsers.findIndex(u => u.id === id);
      if (index < 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      fallbackUsers.splice(index, 1);
      return res.status(204).send();
    }
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { platform, employeeId, products: items } = req.body;
    const employee = parseId(employeeId, 'U');
    if (!employee || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Datos de venta inválidos' });
    }
    const total = items.reduce((sum, it) => sum + Number(it.unitPrice) * Number(it.quantity), 0);
    const [saleResult] = await pool.query(
      'INSERT INTO ventas (id_cliente, id_usuario, fecha, total, estado) VALUES (NULL, ?, NOW(), ?, ?)',
      [employee, total, 'completed']
    );
    const saleId = saleResult.insertId;
    const detailRows = items.map(it => [saleId, parseId(it.productId, 'P'), it.quantity, it.unitPrice]);
    await pool.query('INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES ?', [detailRows]);
    await Promise.all(items.map(it => pool.query('UPDATE productos SET stock = stock - ? WHERE id_producto = ?', [it.quantity, parseId(it.productId, 'P')])));
    res.json({
      id: `V${String(saleId).padStart(3, '0')}`,
      date: formatDate(new Date()),
      products: items,
      total,
      platform,
      status: 'completed',
      receiptNumber: `REC-${String(saleId).padStart(3, '0')}`,
      employeeId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { number, date, clientName, clientEmail, items, totalTax, total, status, notes, createdBy } = req.body;
    const userId = parseId(createdBy, 'U');
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Datos de factura inválidos' });
    }
    const clientId = await getClientId(clientName, clientEmail);
    const [saleResult] = await pool.query(
      'INSERT INTO ventas (id_cliente, id_usuario, fecha, total, estado) VALUES (?, ?, ?, ?, ?)',
      [clientId, userId, date, total, status]
    );
    const saleId = saleResult.insertId;
    const detailRows = items.map(it => [saleId, parseId(it.productId, 'P'), it.quantity, it.unitPrice]);
    await pool.query('INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES ?', [detailRows]);
    await pool.query(
      'INSERT INTO facturacion (id_ventas, numero_factura, fecha, impuestos, total, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [saleId, number, date, totalTax, total, status]
    );
    const invoiceId = Number((await pool.query('SELECT LAST_INSERT_ID() AS id'))[0][0].id);
    res.json({
      id: `INV${String(invoiceId).padStart(3, '0')}`,
      number,
      date,
      dueDate: new Date(new Date(date).setDate(new Date(date).getDate() + 15)).toISOString().split('T')[0],
      clientName,
      clientId: `C${String(clientId).padStart(3, '0')}`,
      clientEmail,
      items,
      subtotal: Number(total) - Number(totalTax),
      totalTax: Number(totalTax),
      total: Number(total),
      status,
      notes: notes || '',
      createdBy,
      notes: notes || '',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear factura' });
  }
});

app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const invoiceId = parseId(req.params.id, 'INV');
    const { status } = req.body;
    if (!invoiceId || !status) return res.status(400).json({ error: 'Datos inválidos' });
    const [[invoiceRow]] = await pool.query(
      'SELECT id_ventas FROM facturacion WHERE id_factura = ?',
      [invoiceId]
    );
    if (!invoiceRow) return res.status(404).json({ error: 'Factura no encontrada' });
    await pool.query('UPDATE facturacion SET estado = ? WHERE id_factura = ?', [status, invoiceId]);
    await pool.query('UPDATE ventas SET estado = ? WHERE id_ventas = ?', [status, invoiceRow.id_ventas]);
    res.json({ id: `INV${String(invoiceId).padStart(3, '0')}`, status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado de factura' });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const invoiceId = parseId(req.params.id, 'INV');
    if (!invoiceId) return res.status(400).json({ error: 'Factura inválida' });
    await pool.query('DELETE FROM facturacion WHERE id_factura = ?', [invoiceId]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar factura' });
  }
});

app.post('/api/tax-rates', async (req, res) => {
  try {
    const taxRate = req.body;
    const existing = taxRatesFallback.find(t => t.id === taxRate.id);
    if (existing) return res.status(400).json({ error: 'Tax rate existe' });
    taxRatesFallback.push(taxRate);
    res.json(taxRate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear tasa de impuesto' });
  }
});

app.put('/api/tax-rates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const changes = req.body;
    const index = taxRatesFallback.findIndex(t => t.id === id);
    if (index < 0) return res.status(404).json({ error: 'Tax rate no encontrado' });
    taxRatesFallback[index] = { ...taxRatesFallback[index], ...changes };
    res.json(taxRatesFallback[index]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar tasa de impuesto' });
  }
});

app.patch('/api/tax-rates/:id/active', async (req, res) => {
  try {
    const { id } = req.params;
    const index = taxRatesFallback.findIndex(t => t.id === id);
    if (index < 0) return res.status(404).json({ error: 'Tax rate no encontrado' });
    taxRatesFallback[index].active = !taxRatesFallback[index].active;
    res.json(taxRatesFallback[index]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado de tasa de impuesto' });
  }
});

const initServer = async () => {
  try {
    await ensurePlatformsTable();
  } catch (error) {
    console.error('No se pudo inicializar la tabla de plataformas. Usando fallback local.', error);
    dbAvailable = false;
  }

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`API server escuchando en http://localhost:${port}`);
  });
};

await initServer();
