import { Router } from "express";
import { permisosController } from "../controllers/permisos.controller";
import { verificarToken } from "../middlewares/verificarToken";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

// Para el Front (sidebar)
router.get("/me/modulos", verificarToken, permisosController.meModulos);

// Solo Admin
router.get("/catalogo", verificarToken, requireAdmin, permisosController.catalogo);
router.post("/seed", verificarToken, requireAdmin, permisosController.seed);
router.get("/roles/:roleId", verificarToken, requireAdmin, permisosController.permisosPorRol);
router.put("/roles/:roleId", verificarToken, requireAdmin, permisosController.reemplazarPermisosRol);
router.patch("/usuarios/:usuarioId/rol", verificarToken, requireAdmin, permisosController.asignarRol);

export default router;
