// ============================================
// EJEMPLOS DE USO - API SUBCATEGORÍAS
// ============================================

// URL base del API
const API_BASE = 'http://localhost:5001/api';

// ============================================
// 1. OBTENER TODAS LAS SUBCATEGORÍAS
// ============================================

async function getAllSubcategories() {
  try {
    const response = await fetch(`${API_BASE}/subcategorias`);
    const subcategories = await response.json();
    console.log('Todas las subcategorías:', subcategories);
    return subcategories;
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
  }
}

// ============================================
// 2. OBTENER SUBCATEGORÍAS POR CATEGORÍA
// ============================================

async function getSubcategoriesByCategory(categoryId) {
  try {
    const response = await fetch(`${API_BASE}/subcategorias/categoria/${categoryId}`);
    const subcategories = await response.json();
    console.log(`Subcategorías de categoría ${categoryId}:`, subcategories);
    return subcategories;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uso:
// getSubcategoriesByCategory(1);

// ============================================
// 3. OBTENER SUBCATEGORÍA POR ID
// ============================================

async function getSubcategoryById(id) {
  try {
    const response = await fetch(`${API_BASE}/subcategorias/${id}`);
    const subcategory = await response.json();
    console.log('Subcategoría:', subcategory);
    return subcategory;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uso:
// getSubcategoryById(1);

// ============================================
// 4. CREAR NUEVA SUBCATEGORÍA
// ============================================

async function createSubcategory(nombre, descripcion, categoriaId, estado = 1) {
  try {
    const response = await fetch(`${API_BASE}/subcategorias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre,
        descripcion,
        categoriaId,
        estado,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const newSubcategory = await response.json();
    console.log('Subcategoría creada:', newSubcategory);
    return newSubcategory;
  } catch (error) {
    console.error('Error al crear subcategoría:', error);
  }
}

// Uso:
// createSubcategory('Laptops', 'Computadoras portátiles', 1, 1);

// ============================================
// 5. ACTUALIZAR SUBCATEGORÍA
// ============================================

async function updateSubcategory(id, nombre, descripcion, estado) {
  try {
    const payload = {};
    if (nombre !== undefined) payload.nombre = nombre;
    if (descripcion !== undefined) payload.descripcion = descripcion;
    if (estado !== undefined) payload.estado = estado;

    const response = await fetch(`${API_BASE}/subcategorias/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const updatedSubcategory = await response.json();
    console.log('Subcategoría actualizada:', updatedSubcategory);
    return updatedSubcategory;
  } catch (error) {
    console.error('Error al actualizar subcategoría:', error);
  }
}

// Uso:
// updateSubcategory(1, 'Laptops Gaming', 'Para gamers', 1);

// ============================================
// 6. ELIMINAR SUBCATEGORÍA
// ============================================

async function deleteSubcategory(id) {
  try {
    const response = await fetch(`${API_BASE}/subcategorias/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Subcategoría eliminada:', result);
    return result;
  } catch (error) {
    console.error('Error al eliminar subcategoría:', error);
  }
}

// Uso:
// deleteSubcategory(1);

// ============================================
// 7. OBTENER PRODUCTOS POR SUBCATEGORÍA
// ============================================

async function getProductsBySubcategory(subcategoryId) {
  try {
    const response = await fetch(`${API_BASE}/products?subcategoriaId=${subcategoryId}`);
    const products = await response.json();
    console.log(`Productos de subcategoría ${subcategoryId}:`, products);
    return products;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uso:
// getProductsBySubcategory(1);

// ============================================
// 8. CREAR PRODUCTO CON SUBCATEGORÍA
// ============================================

async function createProductWithSubcategory(
  nombre,
  precio,
  stock,
  categoriaId,
  subcategoriaId,
  descripcion = '',
  marca = ''
) {
  try {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre,
        precio,
        stock,
        categoria_id: categoriaId,
        subcategoria_id: subcategoriaId,
        descripcion,
        marca,
        estado: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const newProduct = await response.json();
    console.log('Producto creado:', newProduct);
    return newProduct;
  } catch (error) {
    console.error('Error al crear producto:', error);
  }
}

// Uso:
// createProductWithSubcategory(
//   'Laptop Dell XPS',
//   1500,
//   10,
//   1,
//   1,
//   'Laptop gaming potente',
//   'Dell'
// );

// ============================================
// 9. COMPONENTE REACT - SELECTOR DE SUBCATEGORÍAS
// ============================================

/*
import React, { useState, useEffect } from 'react';

const SubcategorySelector = ({ categoryId, onSelectSubcategory }) => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryId) {
      loadSubcategories();
    }
  }, [categoryId]);

  const loadSubcategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/subcategorias/categoria/${categoryId}`
      );
      const data = await response.json();
      setSubcategories(data);
    } catch (error) {
      console.error('Error cargando subcategorías:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label>Subcategoría:</label>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <select onChange={(e) => onSelectSubcategory(e.target.value)}>
          <option value="">-- Seleccionar subcategoría --</option>
          {subcategories.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.nombre}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default SubcategorySelector;
*/

// ============================================
// 10. HOOK PERSONALIZADO - useSubcategories
// ============================================

/*
import { useState, useEffect } from 'react';

export const useSubcategories = (categoryId) => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categoryId) return;

    const fetchSubcategories = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/subcategorias/categoria/${categoryId}`
        );
        if (!response.ok) throw new Error('Error al cargar subcategorías');
        const data = await response.json();
        setSubcategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [categoryId]);

  return { subcategories, loading, error };
};
*/

// ============================================
// EJEMPLOS DE USO EN CONSOLA
// ============================================

/*
// 1. Obtener todas
getAllSubcategories();

// 2. Obtener de categoría
getSubcategoriesByCategory(1);

// 3. Obtener por ID
getSubcategoryById(1);

// 4. Crear
createSubcategory('Tablets', 'Tablets de diversos tamaños', 1);

// 5. Actualizar
updateSubcategory(1, 'Tablets Premium', 'Tablets de gama alta', 1);

// 6. Eliminar
deleteSubcategory(1);

// 7. Productos por subcategoría
getProductsBySubcategory(1);

// 8. Crear producto con subcategoría
createProductWithSubcategory(
  'Samsung Galaxy Tab',
  800,
  15,
  1,
  1,
  'Tablet de 10 pulgadas'
);
*/

// ============================================
// EXPORTS PARA USO EN MÓDULOS
// ============================================

export {
  getAllSubcategories,
  getSubcategoriesByCategory,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getProductsBySubcategory,
  createProductWithSubcategory,
};
