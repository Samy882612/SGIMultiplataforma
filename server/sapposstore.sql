from pathlib import Path

sql = """-- SCRIPT CORREGIDO (fragmento de cambios principales)

USE sapposstore;

-- =====================================
-- CORRECCION TABLA USUARIOS
-- =====================================

ALTER TABLE usuarios
DROP FOREIGN KEY id_rol;

ALTER TABLE usuarios
CHANGE COLUMN `id-rol` id_rol INT NULL;

ALTER TABLE usuarios
ADD CONSTRAINT fk_usuario_rol
FOREIGN KEY (id_rol)
REFERENCES rol(id_rol)
ON UPDATE CASCADE;

-- =====================================
-- ELIMINACION SEGURA DE USUARIOS
-- =====================================

ALTER TABLE ventas
DROP FOREIGN KEY id_usuario;

ALTER TABLE ventas
ADD CONSTRAINT fk_ventas_usuario
FOREIGN KEY (id_usuario)
REFERENCES usuarios(id_usuarios)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- =====================================
-- CORRECCION PRODUCTOS
-- =====================================

ALTER TABLE productos
CHANGE COLUMN id_provedor id_proveedor INT NULL;

ALTER TABLE productos
ADD COLUMN sku VARCHAR(100) UNIQUE;

-- =====================================
-- ELIMINACION SEGURA DE PRODUCTOS
-- =====================================

ALTER TABLE detalle_venta
DROP FOREIGN KEY productos;

ALTER TABLE detalle_venta
ADD CONSTRAINT fk_detalle_producto
FOREIGN KEY (id_producto)
REFERENCES productos(id_producto)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- =====================================
-- DEVOLUCIONES
-- =====================================

ALTER TABLE devoluciones
ADD CONSTRAINT fk_devolucion_producto
FOREIGN KEY (id_producto)
REFERENCES productos(id_producto)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- =====================================
-- TABLA PROVEEDORES
-- =====================================

CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(100),
    direccion VARCHAR(255)
);

-- =====================================
-- INTEGRACIONES
-- =====================================

ALTER TABLE integraciones
ADD COLUMN plataforma ENUM(
'SHOPIFY',
'MERCADOLIBRE',
'AMAZON',
'WOOCOMMERCE',
'TIKTOK_SHOP'
),
ADD COLUMN access_token TEXT,
ADD COLUMN ultima_sincronizacion DATETIME;

-- =====================================
-- COLA DE SINCRONIZACION
-- =====================================

CREATE TABLE IF NOT EXISTS cola_sincronizacion (
    id_cola INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT,
    accion ENUM('CREAR','ACTUALIZAR','ELIMINAR','STOCK'),
    plataforma VARCHAR(50),
    estado ENUM('PENDIENTE','ENVIADO','ERROR'),
    fecha DATETIME,
    FOREIGN KEY (id_producto)
    REFERENCES productos(id_producto)
    ON DELETE CASCADE
);

-- =====================================
-- AUDITORIA
-- =====================================

CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    tabla VARCHAR(50),
    accion VARCHAR(50),
    id_registro INT,
    usuario VARCHAR(100),
    fecha DATETIME,
    detalle TEXT
);
"""

path = "/mnt/data/sapposstore_corregido.sql"
Path(path).write_text(sql, encoding="utf-8")

print(path)
