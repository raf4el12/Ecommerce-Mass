import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Usuario } from "../entities/Usuario.entity";
import { Rol } from "../entities/Rol.entity";
import { Permiso, AdminModulo, AdminAccion } from "../entities/Permiso.entity";
import { RolPermiso } from "../entities/RolPermiso.entity";

export const permisosController = {
  // Para el Sidebar del Admin (módulos visibles según rol)
  async meModulos(req: Request, res: Response) {
    const payload = (req as any).usuario;
    const userId = payload?.userId;
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const userRepo = AppDataSource.getRepository(Usuario);
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["rol", "rol.rolPermisos", "rol.rolPermisos.permiso"],
    });

    if (!user?.rol) return res.status(403).json({ message: "Sin rol" });

    const rolNombre = (user.rol.nombre || "").toLowerCase();
    if (rolNombre.includes("admin") || rolNombre.includes("administrador")) {
      return res.json({ role: user.rol.nombre, modulos: Object.values(AdminModulo) });
    }

    const set = new Set<string>();
    for (const rp of user.rol.rolPermisos || []) {
      if (rp.permiso?.accion === AdminAccion.READ) set.add(rp.permiso.modulo);
    }

    return res.json({ role: user.rol.nombre, modulos: Array.from(set) });
  },

  // Catálogo de módulos/acciones (útil para UI del admin)
  async catalogo(_req: Request, res: Response) {
    return res.json({
      modulos: Object.values(AdminModulo),
      acciones: Object.values(AdminAccion),
    });
  },

  // Seed: crea (modulo x accion) en la tabla Permiso
  async seed(_req: Request, res: Response) {
    const permisoRepo = AppDataSource.getRepository(Permiso);
    let created = 0;

    for (const m of Object.values(AdminModulo)) {
      for (const a of Object.values(AdminAccion)) {
        const exists = await permisoRepo.findOne({ where: { modulo: m, accion: a } });
        if (!exists) {
          await permisoRepo.save(permisoRepo.create({ modulo: m, accion: a }));
          created++;
        }
      }
    }

    return res.json({ message: "Seed OK", created });
  },

  // Ver permisos de un rol
  async permisosPorRol(req: Request, res: Response) {
    const roleId = Number(req.params.roleId);
    const rolRepo = AppDataSource.getRepository(Rol);

    const rol = await rolRepo.findOne({
      where: { id: roleId },
      relations: ["rolPermisos", "rolPermisos.permiso"],
    });

    if (!rol) return res.status(404).json({ message: "Rol no existe" });

    const permisos = (rol.rolPermisos || []).map((rp) => ({
      modulo: rp.permiso.modulo,
      accion: rp.permiso.accion,
    }));

    return res.json({ roleId, roleName: rol.nombre, permisos });
  },

  // Reemplazar permisos de un rol (BORRA y vuelve a insertar)
  async reemplazarPermisosRol(req: Request, res: Response) {
    const roleId = Number(req.params.roleId);
    const { permisos } = req.body as { permisos: Array<{ modulo: AdminModulo; accion: AdminAccion }> };

    if (!Array.isArray(permisos)) {
      return res.status(400).json({ message: "permisos debe ser un array" });
    }

    const rolRepo = AppDataSource.getRepository(Rol);
    const permisoRepo = AppDataSource.getRepository(Permiso);
    const rpRepo = AppDataSource.getRepository(RolPermiso);

    const rol = await rolRepo.findOne({ where: { id: roleId } });
    if (!rol) return res.status(404).json({ message: "Rol no existe" });

    await rpRepo.delete({ rolId: roleId });

    let inserted = 0;
    for (const item of permisos) {
      const p = await permisoRepo.findOne({ where: { modulo: item.modulo, accion: item.accion } });
      if (!p) continue;
      await rpRepo.save(rpRepo.create({ rolId: roleId, permisoId: p.id }));
      inserted++;
    }

    return res.json({ message: "Permisos actualizados", roleId, inserted });
  },

  // Asignar rol a un usuario
  async asignarRol(req: Request, res: Response) {
    const usuarioId = Number(req.params.usuarioId);
    const { rolId } = req.body as { rolId: number };

    if (!rolId) return res.status(400).json({ message: "rolId requerido" });

    const userRepo = AppDataSource.getRepository(Usuario);
    const rolRepo = AppDataSource.getRepository(Rol);

    const user = await userRepo.findOne({ where: { id: usuarioId }, relations: ["rol"] });
    if (!user) return res.status(404).json({ message: "Usuario no existe" });

    const rol = await rolRepo.findOne({ where: { id: rolId } });
    if (!rol) return res.status(404).json({ message: "Rol no existe" });

    // Como tu Usuario no tiene rolId, asignamos por relación
    user.rol = rol;
    await userRepo.save(user);

    return res.json({ message: "Rol asignado", usuarioId, rolId, rolNombre: rol.nombre });
  },
};
