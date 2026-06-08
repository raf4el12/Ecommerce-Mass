import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Usuario } from "../entities/Usuario.entity";

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = (req as any).usuario; // viene de verificarToken
    const userId = payload?.userId;

    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const repo = AppDataSource.getRepository(Usuario);
    const user = await repo.findOne({
      where: { id: userId },
      relations: ["rol"],
    });

    if (!user?.rol) return res.status(403).json({ message: "Usuario sin rol" });

    const rolNombre = (user.rol.nombre || "").toLowerCase();
    if (!rolNombre.includes("admin") && !rolNombre.includes("administrador")) {
      return res.status(403).json({ message: "Solo administrador" });
    }

    next();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error en requireAdmin" });
  }
};
