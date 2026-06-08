-- ============================================
-- INSERTS DE SUBCATEGORÍAS
-- Ejecutar este script para agregar datos de prueba
-- ============================================

-- 1. ABARROTES
INSERT INTO Subcategorias (nombre, descripcion, categoriaId, estadoId) VALUES
('Aceites y Grasas', 'Aceites vegetales, oliva y grasas para cocinar', 1, 1),
('Harinas y Cereales', 'Harinas, arroz y productos a base de granos', 1, 1),
('Especias y Condimentos', 'Especias, sal, azúcar y condimentos varios', 1, 1),
('Enlatados', 'Productos enlatados y conservas', 1, 1);

-- 2. BEBIDAS
INSERT INTO Subcategorias (nombre, descripcion, categoriaId, estadoId) VALUES
('Bebidas Alcohólicas', 'Cervezas, vinos y licores', 2, 1),
('Bebidas No Alcohólicas', 'Jugos, refrescos y bebidas naturales', 2, 1),
('Agua y Bebidas Isotónicas', 'Agua embotellada y bebidas deportivas', 2, 1);

-- 3. LÁCTEOS
INSERT INTO Subcategorias (nombre, descripcion, categoriaId, estadoId) VALUES
('Leches', 'Leche entera, descremada y bebidas lácteas', 3, 1),
('Quesos', 'Queso fresco, mozzarella y otros tipos', 3, 1),
('Yogures', 'Yogures naturales y saborizados', 3, 1),
('Mantequilla y Cremas', 'Mantequilla y cremas lácteas', 3, 1);

-- 4. CONFITERÍA
INSERT INTO Subcategorias (nombre, descripcion, categoriaId, estadoId) VALUES
('Chocolates', 'Chocolate negro, con leche y blanco', 4, 1),
('Dulces y Caramelos', 'Caramelos, gomitas y dulces variados', 4, 1),
('Golosinas', 'Galletas dulces y golosinas', 4, 1);

-- 5. PANADERÍA
INSERT INTO Subcategorias (nombre, descripcion, categoriaId, estadoId) VALUES
('Pan', 'Pan blanco, integral y artesanal', 5, 1),
('Pasteles y Bizcochos', 'Pasteles, brownies y productos horneados', 5, 1),
('Galletas', 'Galletas dulces y saladas', 5, 1);

-- 6. PIQUEOS
INSERT INTO Subcategorias (nombre, descripcion, categoriaId, estadoId) VALUES
('Snacks Salados', 'Papas fritas, pretzels y snacks salados', 6, 1),
('Snacks Dulces', 'Barras de cereal, frutas secas y snacks dulces', 6, 1),
('Frutos Secos', 'Almendras, cacahuetes y frutos secos', 6, 1);

-- 7. LIMPIEZA
INSERT INTO Subcategorias (nombre, descripcion, categoriaId, estadoId) VALUES
('Limpiadores Multiusos', 'Desengrasantes y limpiadores generales', 7, 1),
('Desinfectantes', 'Desinfectantes y desodorizantes', 7, 1),
('Detergentes', 'Detergentes para ropa y platos', 7, 1),
('Cepillos y Escobas', 'Herramientas de limpieza', 7, 1);

-- 8. CUIDADO PERSONAL
INSERT INTO Subcategorias (nombre, descripcion, categoriaId, estadoId) VALUES
('Higiene Dental', 'Pasta dental, cepillos y enjuagues bucales', 8, 1),
('Cuidado Capilar', 'Shampoo, acondicionador y tratamientos capilares', 8, 1),
('Higiene Corporal', 'Jabones, geles de baño y productos corporales', 8, 1),
('Desodorantes', 'Desodorantes y antitranspirantes', 8, 1);
