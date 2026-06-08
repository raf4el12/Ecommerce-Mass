import { Router } from "express";
import {
  obtenerTiendas,
  obtenerTiendaPorId,
  crearTienda,
  actualizarTienda,
  eliminarTienda,
  obtenerTiendasActivas
} from "../controllers/tienda.controller";

const router = Router();

router.get("/", obtenerTiendas);
router.get("/activas", obtenerTiendasActivas);

router.get("/:id", obtenerTiendaPorId);
router.post("/", crearTienda);
router.put("/:id", actualizarTienda);
router.delete("/:id", eliminarTienda);

export default router;
