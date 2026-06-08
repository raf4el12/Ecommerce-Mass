import { Router } from "express";
import { getClienteMe } from "../controllers/cliente.controller";
import { verificarToken } from '../middlewares/verificarToken';
import { updateClienteMe } from "../controllers/cliente.controller";

const router = Router();

router.get("/clientes/me", verificarToken, getClienteMe);


router.put("/clientes/me", verificarToken, updateClienteMe);

export default router;
