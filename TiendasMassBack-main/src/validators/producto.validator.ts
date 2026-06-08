import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    marca: z.string().optional(),
    precio: z.coerce.number().positive('El precio debe ser positivo'),
    descripcion: z.string().optional(),
    stock: z.coerce.number().min(0, 'El stock no puede ser negativo').optional(),
    estado: z.union([z.boolean(), z.string(), z.number()]).optional(),
    categoria_id: z.coerce.number().positive(),
    subcategoria_ids: z.any().optional(), // Puede ser string JSON o array de ints debido al FormData
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    nombre: z.string().min(2).optional(),
    marca: z.string().optional(),
    precio: z.coerce.number().positive().optional(),
    descripcion: z.string().optional(),
    stock: z.coerce.number().min(0).optional(),
    estado: z.union([z.boolean(), z.string(), z.number()]).optional(),
    categoria_id: z.coerce.number().positive().optional(),
    subcategoria_ids: z.any().optional(),
  })
});
