import { Router } from "express";
import { listarTiposCliente } from "../controllers/tipoCliente.controller";

const router = Router();

router.get("/tipos-cliente", listarTiposCliente);

export default router;
