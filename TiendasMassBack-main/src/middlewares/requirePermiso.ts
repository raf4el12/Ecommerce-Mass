import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Usuario } from "../entities/Usuario.entity";
import { RolPermiso } from "../entities/RolPermiso.entity";
import { Permiso, AdminModulo, AdminAccion } from "../entities/Permiso.entity";

export function requirePermiso(modulo: AdminModulo, accion: AdminAccion) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const payload = (req as any).usuario;
			const userId = payload?.userId;
			if (!userId) return res.status(401).json({ message: "No autenticado" });

			const userRepo = AppDataSource.getRepository(Usuario);
			const user = await userRepo.findOne({
				where: { id: userId },
				relations: ["rol", "rol.rolPermisos", "rol.rolPermisos.permiso"],
			});
			if (!user?.rol) return res.status(403).json({ message: "Sin rol" });

			// Admins pueden todo
			const rolNombre = (user.rol.nombre || "").toLowerCase();
			if (rolNombre.includes("admin")) return next();

			// Buscar permiso
			const tienePermiso = (user.rol.rolPermisos || []).some(
				(rp) =>
					rp.permiso?.modulo === modulo &&
					rp.permiso?.accion === accion
			);
			if (!tienePermiso) {
				return res.status(403).json({ message: `No tienes permiso para ${accion} en ${modulo}` });
			}
			next();
		} catch (e) {
			console.error(e);
			return res.status(500).json({ message: "Error en requirePermiso" });
		}
	};
}
