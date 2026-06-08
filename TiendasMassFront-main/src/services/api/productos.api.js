import { api } from './axios.instance';

export const getProductos = async (categoriaId, subcategoriaId, searchQuery) => {
  const params = new URLSearchParams();
  if (categoriaId) params.append('categoriaId', categoriaId);
  if (subcategoriaId) params.append('subcategoriaId', subcategoriaId);
  if (searchQuery) params.append('q', searchQuery);

  const queryStr = params.toString();
  const url = queryStr ? `/products?${queryStr}` : '/products';
  
  const response = await api.get(url);
  return response.data;
};

export const getProductoById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProducto = async (formData) => {
  // Cuando se envía FormData, Axios detecta automáticamente el Content-Type multipart/form-data
  const response = await api.post('/products', formData);
  return response.data;
};

export const updateProducto = async (id, formData) => {
  const response = await api.put(`/products/${id}`, formData);
  return response.data;
};

export const deleteProducto = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
