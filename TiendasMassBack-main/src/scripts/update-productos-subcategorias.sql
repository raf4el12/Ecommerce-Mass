-- ============================================
-- UPDATE PRODUCTOS CON SUBCATEGORÍAS
-- Asigna subcategorías a los productos existentes
-- ============================================

-- 1. ABARROTES (categoriaId = 1)
-- Subcategoría: Aceites y Grasas (id = 1)
UPDATE Productos SET subcategoriaId = 1 WHERE id = 1; -- Aceite de Girasol

-- Subcategoría: Harinas y Cereales (id = 2)
UPDATE Productos SET subcategoriaId = 2 WHERE id = 2; -- Harina de Trigo

-- 2. BEBIDAS (categoriaId = 2)
-- Subcategoría: Bebidas Alcohólicas (id = 5)
UPDATE Productos SET subcategoriaId = 5 WHERE id = 3; -- Cerveza Pilsen

-- Subcategoría: Bebidas No Alcohólicas (id = 6)
UPDATE Productos SET subcategoriaId = 6 WHERE id = 4; -- Jugo de Mango

-- 3. LÁCTEOS (categoriaId = 3)
-- Subcategoría: Leches (id = 9)
UPDATE Productos SET subcategoriaId = 9 WHERE id = 5; -- Leche Entera

-- Subcategoría: Quesos (id = 10)
UPDATE Productos SET subcategoriaId = 10 WHERE id = 6; -- Queso Fresco

-- 4. CONFITERÍA (categoriaId = 4)
-- Subcategoría: Chocolates (id = 13)
UPDATE Productos SET subcategoriaId = 13 WHERE id = 7; -- Chocolate Negro

-- Subcategoría: Dulces y Caramelos (id = 14)
UPDATE Productos SET subcategoriaId = 14 WHERE id = 8; -- Gomitas Frutales

-- 5. PANADERÍA (categoriaId = 5)
-- Subcategoría: Pan (id = 17)
UPDATE Productos SET subcategoriaId = 17 WHERE id = 9; -- Pan Integral

