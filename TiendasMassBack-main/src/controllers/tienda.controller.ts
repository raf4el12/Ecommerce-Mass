import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Tienda } from "../entities/Tienda.entity";

export const obtenerTiendas = async (req: Request, res: Response): Promise<Response> => {
  try {
    const tiendaRepo = AppDataSource.getRepository(Tienda);

    const tiendas = await tiendaRepo.find({
      order: { nombre: "ASC" },
      select: ["id", "nombre", "telefono", "direccion", "activo"]
    });

    return res.json(tiendas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener tiendas" });
  }
};

export const obtenerTiendasActivas = async (req: Request, res: Response): Promise<Response> => {
  try {
    const tiendaRepo = AppDataSource.getRepository(Tienda);

    const tiendas = await tiendaRepo.find({
      where: { activo: true },
      order: { nombre: "ASC" },
      select: ["id", "nombre", "direccion", "telefono"]
    });

    return res.json(tiendas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener tiendas activas" });
  }
};


export const obtenerTiendaPorId = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const tiendaRepo = AppDataSource.getRepository(Tienda);
    const tienda = await tiendaRepo.findOne({ where: { id: parseInt(id) } });

    if (!tienda) return res.status(404).json({ error: "Tienda no encontrada" });
    return res.json(tienda);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener tienda" });
  }
};

export const crearTienda = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { nombre, direccion, telefono, activo } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    if (!direccion || !direccion.trim()) {
      return res.status(400).json({ error: "La dirección es obligatoria" });
    }

    const tiendaRepo = AppDataSource.getRepository(Tienda);

    // Duplicado por nombre (case-insensitive)
    const existente = await tiendaRepo
      .createQueryBuilder("t")
      .where("LOWER(t.nombre) = LOWER(:nombre)", { nombre: nombre.trim() })
      .getOne();

    if (existente) {
      return res.status(400).json({ error: "Ya existe una tienda con ese nombre" });
    }

    const nueva = tiendaRepo.create({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      telefono: telefono?.trim() || null,
      activo: activo !== undefined ? activo : true
    });

    const guardada = await tiendaRepo.save(nueva);
    return res.status(201).json(guardada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al crear tienda" });
  }
};

export const actualizarTienda = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, activo } = req.body;

    const tiendaRepo = AppDataSource.getRepository(Tienda);
    const tienda = await tiendaRepo.findOne({ where: { id: parseInt(id) } });

    if (!tienda) return res.status(404).json({ error: "Tienda no encontrada" });

    if (nombre !== undefined && !nombre.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    if (direccion !== undefined && !direccion.trim()) {
      return res.status(400).json({ error: "La dirección es obligatoria" });
    }

    // Si cambia el nombre, validar duplicado (case-insensitive)
    if (nombre !== undefined && nombre.trim().toLowerCase() !== tienda.nombre.trim().toLowerCase()) {
      const existente = await tiendaRepo
        .createQueryBuilder("t")
        .where("LOWER(t.nombre) = LOWER(:nombre)", { nombre: nombre.trim() })
        .andWhere("t.id != :id", { id: tienda.id })
        .getOne();

      if (existente) {
        return res.status(400).json({ error: "Ya existe una tienda con ese nombre" });
      }
    }

    tienda.nombre = nombre !== undefined ? nombre.trim() : tienda.nombre;
    tienda.direccion = direccion !== undefined ? direccion.trim() : tienda.direccion;
    tienda.telefono = telefono !== undefined ? (telefono?.trim() || null) : tienda.telefono;
    tienda.activo = activo !== undefined ? activo : tienda.activo;

    const actualizada = await tiendaRepo.save(tienda);
    return res.json(actualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al actualizar tienda" });
  }
};


export const eliminarTienda = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const tiendaRepo = AppDataSource.getRepository(Tienda);

    const tienda = await tiendaRepo.findOne({ where: { id: parseInt(id) } });
    if (!tienda) return res.status(404).json({ error: "Tienda no encontrada" });

    await tiendaRepo.remove(tienda);
    return res.json({ message: "Tienda eliminada correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al eliminar tienda" });
  }
};
