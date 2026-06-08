-- Script de migración para agregar tabla de Subcategorías
-- Ejecutar este script solo si necesita crear la tabla manualmente

CREATE TABLE IF NOT EXISTS Subcategorias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  descripcion LONGTEXT,
  categoriaId INT NOT NULL,
  estadoId INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_subcategoria_categoria FOREIGN KEY (categoriaId) REFERENCES Categorias(id) ON DELETE CASCADE,
  CONSTRAINT fk_subcategoria_estado FOREIGN KEY (estadoId) REFERENCES Estados(id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_subcategoria_categoria ON Subcategorias(categoriaId);
CREATE INDEX idx_subcategoria_estado ON Subcategorias(estadoId);
CREATE INDEX idx_subcategoria_nombre ON Subcategorias(nombre);

-- Actualizar tabla Productos para agregar columna de subcategoría
ALTER TABLE Productos ADD COLUMN IF NOT EXISTS subcategoriaId INT;
ALTER TABLE Productos ADD CONSTRAINT fk_producto_subcategoria 
  FOREIGN KEY (subcategoriaId) REFERENCES Subcategorias(id) ON DELETE SET NULL;

-- Índice para optimizar consultas de productos por subcategoría
CREATE INDEX IF NOT EXISTS idx_producto_subcategoria ON Productos(subcategoriaId);
