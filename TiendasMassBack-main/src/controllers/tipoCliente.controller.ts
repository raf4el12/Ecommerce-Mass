import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { TipoCliente } from "../entities/TipoCliente.entity";

export const listarTiposCliente = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TipoCliente);
    const tipos = await repo.find({ order: { id: "ASC" } });
    return res.status(200).json(tipos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al obtener tipos de cliente"
    });
  }
};
