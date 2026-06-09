import type { Product, Sale, User, TaxRate, Invoice } from '../types';

export const mockTaxRates: TaxRate[] = [
  { id: 'T001', name: 'IVA 19%', rate: 19, description: 'Impuesto al Valor Agregado general', active: true },
  { id: 'T002', name: 'IVA 5%', rate: 5, description: 'IVA reducido para bienes básicos', active: true },
  { id: 'T003', name: 'Exento (0%)', rate: 0, description: 'Bienes y servicios exentos de IVA', active: true },
  { id: 'T004', name: 'IVA 12%', rate: 12, description: 'Tarifa especial por categoría', active: false },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'INV001', number: 'FAC-2024-001', date: '2024-06-01', dueDate: '2024-06-16',
    clientName: 'Empresa Tech SAS', clientId: 'C001', clientEmail: 'compras@techsas.com',
    status: 'paid', notes: 'Pago recibido puntualmente.', createdBy: 'U001',
    items: [
      { productId: 'P001', productName: 'Laptop HP 15"', quantity: 1, unitPrice: 2499000, taxRateId: 'T001', taxAmount: 474810, subtotal: 2499000, total: 2973810 },
    ],
    subtotal: 2499000, totalTax: 474810, total: 2973810,
  },
  {
    id: 'INV002', number: 'FAC-2024-002', date: '2024-06-03', dueDate: '2024-06-18',
    clientName: 'Distribuidora Norte Ltda', clientId: 'C002', clientEmail: 'info@distrnorte.com',
    status: 'issued', notes: '', createdBy: 'U001',
    items: [
      { productId: 'P004', productName: 'Monitor 24" Full HD', quantity: 2, unitPrice: 699000, taxRateId: 'T001', taxAmount: 265620, subtotal: 1398000, total: 1663620 },
      { productId: 'P002', productName: 'Mouse Inalámbrico Logitech', quantity: 5, unitPrice: 89000, taxRateId: 'T001', taxAmount: 84550, subtotal: 445000, total: 529550 },
    ],
    subtotal: 1843000, totalTax: 350170, total: 2193170,
  },
  {
    id: 'INV003', number: 'FAC-2024-003', date: '2024-06-05', dueDate: '2024-06-20',
    clientName: 'Soluciones Digitales SRL', clientId: 'C003', clientEmail: 'admin@soldig.co',
    status: 'overdue', notes: 'Pendiente de cobro — segundo aviso.', createdBy: 'U001',
    items: [
      { productId: 'P005', productName: 'Audífonos Bluetooth Sony', quantity: 3, unitPrice: 299000, taxRateId: 'T001', taxAmount: 170430, subtotal: 897000, total: 1067430 },
    ],
    subtotal: 897000, totalTax: 170430, total: 1067430,
  },
  {
    id: 'INV004', number: 'FAC-2024-004', date: '2024-06-06', dueDate: '2024-06-21',
    clientName: 'Colegio San Marcos', clientId: 'C004', clientEmail: 'rector@sanmarcos.edu.co',
    status: 'draft', notes: 'Borrador pendiente de revisión.', createdBy: 'U002',
    items: [
      { productId: 'P007', productName: 'Webcam Full HD 1080p', quantity: 10, unitPrice: 159000, taxRateId: 'T002', taxAmount: 79500, subtotal: 1590000, total: 1669500 },
    ],
    subtotal: 1590000, totalTax: 79500, total: 1669500,
  },
  {
    id: 'INV005', number: 'FAC-2024-005', date: '2024-06-07', dueDate: '2024-07-07',
    clientName: 'Gobierno Municipal', clientId: 'C005', clientEmail: 'tic@municipio.gov.co',
    status: 'cancelled', notes: 'Cancelada por cambio de proveedor.', createdBy: 'U001',
    items: [
      { productId: 'P006', productName: 'Disco SSD 500GB', quantity: 20, unitPrice: 189000, taxRateId: 'T003', taxAmount: 0, subtotal: 3780000, total: 3780000 },
    ],
    subtotal: 3780000, totalTax: 0, total: 3780000,
  },
];

export const mockProducts: Product[] = [
  { id: 'P001', name: 'Laptop HP 15"', cost: 1800000, price: 2499000, quantity: 12, category: 'Computadores', sku: 'LAP-HP-001', minStock: 5 },
  { id: 'P002', name: 'Mouse Inalámbrico Logitech', cost: 45000, price: 89000, quantity: 8, category: 'Periféricos', sku: 'MOU-LOG-002', minStock: 10 },
  { id: 'P003', name: 'Teclado Mecánico RGB', cost: 120000, price: 199000, quantity: 3, category: 'Periféricos', sku: 'TEC-MEC-003', minStock: 5 },
  { id: 'P004', name: 'Monitor 24" Full HD', cost: 450000, price: 699000, quantity: 6, category: 'Monitores', sku: 'MON-24-004', minStock: 4 },
  { id: 'P005', name: 'Audífonos Bluetooth Sony', cost: 180000, price: 299000, quantity: 15, category: 'Audio', sku: 'AUD-SON-005', minStock: 8 },
  { id: 'P006', name: 'Disco SSD 500GB', cost: 120000, price: 189000, quantity: 20, category: 'Almacenamiento', sku: 'SSD-500-006', minStock: 10 },
  { id: 'P007', name: 'Webcam Full HD 1080p', cost: 95000, price: 159000, quantity: 9, category: 'Periféricos', sku: 'WEB-FHD-007', minStock: 5 },
  { id: 'P008', name: 'Tablet Samsung A8', cost: 600000, price: 899000, quantity: 4, category: 'Tablets', sku: 'TAB-SAM-008', minStock: 3 },
  { id: 'P009', name: 'Cable HDMI 2m', cost: 12000, price: 29000, quantity: 45, category: 'Cables', sku: 'CAB-HDM-009', minStock: 15 },
  { id: 'P010', name: 'Hub USB 4 puertos', cost: 35000, price: 65000, quantity: 2, category: 'Periféricos', sku: 'HUB-USB-010', minStock: 8 },
];

export const mockSales: Sale[] = [
  {
    id: 'V001', date: '2024-06-01', total: 2499000, platform: 'local',
    status: 'completed', receiptNumber: 'REC-001', employeeId: 'U002',
    products: [{ productId: 'P001', productName: 'Laptop HP 15"', quantity: 1, unitPrice: 2499000, subtotal: 2499000 }]
  },
  {
    id: 'V002', date: '2024-06-02', total: 178000, platform: 'mercadolibre',
    status: 'completed', receiptNumber: 'REC-002', employeeId: 'U002',
    products: [
      { productId: 'P002', productName: 'Mouse Inalámbrico Logitech', quantity: 2, unitPrice: 89000, subtotal: 178000 }
    ]
  },
  {
    id: 'V003', date: '2024-06-03', total: 699000, platform: 'falabella',
    status: 'completed', receiptNumber: 'REC-003', employeeId: 'U002',
    products: [{ productId: 'P004', productName: 'Monitor 24" Full HD', quantity: 1, unitPrice: 699000, subtotal: 699000 }]
  },
  {
    id: 'V004', date: '2024-06-04', total: 199000, platform: 'local',
    status: 'returned', receiptNumber: 'REC-004', employeeId: 'U002',
    products: [{ productId: 'P003', productName: 'Teclado Mecánico RGB', quantity: 1, unitPrice: 199000, subtotal: 199000 }]
  },
  {
    id: 'V005', date: '2024-06-05', total: 448000, platform: 'mercadolibre',
    status: 'completed', receiptNumber: 'REC-005', employeeId: 'U002',
    products: [
      { productId: 'P005', productName: 'Audífonos Bluetooth Sony', quantity: 1, unitPrice: 299000, subtotal: 299000 },
      { productId: 'P009', productName: 'Cable HDMI 2m', quantity: 5, unitPrice: 29000, subtotal: 145000 }
    ]
  },
  {
    id: 'V006', date: '2024-06-06', total: 1134000, platform: 'local',
    status: 'completed', receiptNumber: 'REC-006', employeeId: 'U002',
    products: [
      { productId: 'P006', productName: 'Disco SSD 500GB', quantity: 2, unitPrice: 189000, subtotal: 378000 },
      { productId: 'P004', productName: 'Monitor 24" Full HD', quantity: 1, unitPrice: 699000, subtotal: 699000 }
    ]
  },
];

export const mockUsers: User[] = [
  { id: 'U001', name: 'Sandra Zapata', email: 'admin@sapposstore.com', password: 'admin123', role: 'admin', active: true, createdAt: '2024-01-01' },
  { id: 'U002', name: 'Cristian Goez', email: 'cristian@sapposstore.com', password: 'cristian123', role: 'employee', active: true, createdAt: '2024-01-15' },
  { id: 'U003', name: 'Sebastian Guluma', email: 'sebastian@sapposstore.com', password: 'sebastian123', role: 'employee', active: true, createdAt: '2024-02-01' },
  { id: 'U004', name: 'Pedro Munévar', email: 'pedro@sapposstore.com', password: 'pedro123', role: 'employee', active: false, createdAt: '2024-03-01' },
];
