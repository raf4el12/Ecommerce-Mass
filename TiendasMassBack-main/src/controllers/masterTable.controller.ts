import { Request, Response } from "express";
import { AppDataSource } from '../config/data-source';
import { MasterTable } from "../entities/MasterTable.entity";

const repo = () => AppDataSource.getRepository(MasterTable);

const asIntOrNull = (v: any) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const masterTableController = {
  // GET /api/master-table?parentId=100&status=A
  async list(req: Request, res: Response) {
    try {
      const parentId = asIntOrNull(req.query.parentId);
      const status = (req.query.status as string | undefined) ?? undefined;

      const qb = repo()
        .createQueryBuilder("mt")
        .leftJoinAndSelect("mt.parent", "parent")
        .orderBy("mt.parentId", "ASC")
        .addOrderBy("mt.order", "ASC")
        .addOrderBy("mt.name", "ASC");

      if (parentId !== null) qb.andWhere("mt.parentId = :parentId", { parentId });
      if (status) qb.andWhere("mt.status = :status", { status });

      const data = await qb.getMany();
      return res.json(data);
    } catch (e) {
      return res.status(500).json({ message: "Error al listar MasterTable", error: String(e) });
    }
  },

  // GET /api/master-table/:id
  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "ID inválido" });

      const item = await repo().findOne({
        where: { id },
        relations: { parent: true, children: true },
      });

      if (!item) return res.status(404).json({ message: "No encontrado" });
      return res.json(item);
    } catch (e) {
      return res.status(500).json({ message: "Error al obtener MasterTable", error: String(e) });
    }
  },

  // POST /api/master-table
  async create(req: Request, res: Response) {
    try {
      const body = req.body ?? {};

      const parentId = asIntOrNull(body.parentId);
      const name = (body.name ?? "").trim();
      const value = body.value !== undefined && body.value !== null ? String(body.value).trim() : null;

      if (!name) return res.status(400).json({ message: "name es requerido" });

      // Si es hijo, value debería existir (como tu pizarra)
      if (parentId !== null && (!value || value.length === 0)) {
        return res.status(400).json({ message: "value es requerido cuando parentId existe" });
      }

      // Validación: si es raíz, name único entre raíces
      if (parentId === null) {
        const existsRoot = await repo()
        .createQueryBuilder("mt")
        .where("mt.parentId IS NULL")
        .andWhere("mt.name = :name", { name })
        .getOne();
        if (existsRoot) return res.status(409).json({ message: "Ya existe un catálogo raíz con ese name" });
      }

      // Validación: value único por parent (el índice también lo asegura)
      if (parentId !== null && value) {
        const existsChild = await repo().findOne({ where: { parentId, value } });
        if (existsChild) return res.status(409).json({ message: "Ya existe ese value en ese parentId" });
      }

      // Generar ID automáticamente basado en la estructura jerárquica
      let id: number;
      
      if (parentId === null) {
        // Es una tabla padre: buscar el próximo múltiplo de 100
        const maxParent = await repo()
          .createQueryBuilder("mt")
          .where("mt.parentId IS NULL")
          .orderBy("mt.id", "DESC")
          .getOne();
        
        id = maxParent ? maxParent.id + 100 : 100;
      } else {
        // Es un hijo: buscar el próximo ID después del último hijo del mismo padre
        const maxChild = await repo()
          .createQueryBuilder("mt")
          .where("mt.parentId = :parentId", { parentId })
          .orderBy("mt.id", "DESC")
          .getOne();
        
        id = maxChild ? maxChild.id + 1 : parentId + 1;
      }

      const item = repo().create({
        id,
        parentId,
        value,
        description: body.description ?? null,
        name,
        order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
        additionalOne: body.additionalOne ?? null,
        additionalTwo: body.additionalTwo ?? null,
        additionalThree: body.additionalThree ?? null,
        userNew: body.userNew ?? null,
        userEdit: null,
        status: body.status === "I" ? "I" : "A",
      });

      const saved = await repo().save(item);
      return res.status(201).json(saved);
    } catch (e: any) {
      // por si cae el unique index
      if (String(e?.code) === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Registro duplicado (parentId + value)" });
      }
      return res.status(500).json({ message: "Error al crear MasterTable", error: String(e) });
    }
  },

  // PUT /api/master-table/:id
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "ID inválido" });

      const body = req.body ?? {};
      const item = await repo().findOne({ where: { id } });
      if (!item) return res.status(404).json({ message: "No encontrado" });

      const parentId = body.parentId !== undefined ? asIntOrNull(body.parentId) : item.parentId;
      const name = body.name !== undefined ? String(body.name).trim() : item.name;
      const value =
        body.value !== undefined ? (body.value === null ? null : String(body.value).trim()) : item.value;

      if (!name) return res.status(400).json({ message: "name es requerido" });

      if (parentId !== null && (!value || value.length === 0)) {
        return res.status(400).json({ message: "value es requerido cuando parentId existe" });
      }

      // Si cambia a raíz: name único entre raíces
      if (parentId === null && name !== item.name) {
        const existsRoot = await repo()
        .createQueryBuilder("mt")
        .where("mt.parentId IS NULL")
        .andWhere("mt.name = :name", { name })
        .getOne();
        if (existsRoot) return res.status(409).json({ message: "Ya existe un catálogo raíz con ese name" });
      }

      // value único por parent (excluyendo el mismo id)
      if (parentId !== null && value) {
        const dup = await repo()
          .createQueryBuilder("mt")
          .where("mt.parentId = :parentId AND mt.value = :value AND mt.id <> :id", { parentId, value, id })
          .getOne();
        if (dup) return res.status(409).json({ message: "Ya existe ese value en ese parentId" });
      }

      item.parentId = parentId;
      item.name = name;
      item.value = value;
      item.description = body.description !== undefined ? body.description : item.description;
      item.order = body.order !== undefined && Number.isFinite(Number(body.order)) ? Number(body.order) : item.order;
      item.additionalOne = body.additionalOne !== undefined ? body.additionalOne : item.additionalOne;
      item.additionalTwo = body.additionalTwo !== undefined ? body.additionalTwo : item.additionalTwo;
      item.additionalThree = body.additionalThree !== undefined ? body.additionalThree : item.additionalThree;
      item.userEdit = body.userEdit ?? item.userEdit;
      item.status = body.status === "I" ? "I" : body.status === "A" ? "A" : item.status;

      const saved = await repo().save(item);
      return res.json(saved);
    } catch (e: any) {
      if (String(e?.code) === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Registro duplicado (parentId + value)" });
      }
      return res.status(500).json({ message: "Error al actualizar MasterTable", error: String(e) });
    }
  },

  // DELETE /api/master-table/:id  -> soft delete (status = I)
  async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "ID inválido" });

      const item = await repo().findOne({ where: { id } });
      if (!item) return res.status(404).json({ message: "No encontrado" });

      item.status = "I";
      const saved = await repo().save(item);
      return res.json({ message: "Inactivado", item: saved });
    } catch (e) {
      return res.status(500).json({ message: "Error al eliminar (soft) MasterTable", error: String(e) });
    }
  },
};
