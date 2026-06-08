import { Router } from "express";
import { masterTableController } from "../controllers/masterTable.controller";

const router = Router();

router.get("/", masterTableController.list);
router.get("/:id", masterTableController.getById);
router.post("/", masterTableController.create);
router.put("/:id", masterTableController.update);
router.delete("/:id", masterTableController.remove);

export default router;
