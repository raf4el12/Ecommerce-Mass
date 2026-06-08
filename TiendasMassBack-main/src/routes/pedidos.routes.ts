import { Router } from "express";
import {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstadoPedido,
  eliminarPedido,
  obtenerPedidosPorUsuario,
  obtenerEstadisticasPedidos
} from "../controllers/pedido.controller";
import { pagarPedido } from "../controllers/pagarpedio.controller";

// Import extra para actualizar solo estado_pago
import { AppDataSource } from "../config/data-source";
import { Pedido, EstadoPago } from "../entities/Pedidos.entity";

const router = Router();

router.post("/", crearPedido);
router.get("/estadisticas", obtenerEstadisticasPedidos);
router.get("/usuario/:usuarioId", obtenerPedidosPorUsuario);
router.get("/", obtenerPedidos);
router.get("/:id", obtenerPedidoPorId);
router.put("/:id", actualizarEstadoPedido);
router.delete("/:id", eliminarPedido);
router.post("/pagar", pagarPedido);

// 🔥 NUEVA RUTA: actualizar SOLO el estado de pago de un pedido
// PATCH /api/pedidos/:id/estado-pago
router.patch("/:id/estado-pago", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estadoPago } = req.body;

    if (!id || !estadoPago) {
      return res.status(400).json({ error: "Faltan datos: id o estadoPago" });
    }

    const estadoNormalizado = (estadoPago as string).toUpperCase();

    let estadoFinal: EstadoPago;
    switch (estadoNormalizado) {
      case "COMPLETADO":
      case "APPROVED":
      case "ACCREDITED":
        estadoFinal = EstadoPago.COMPLETADO;
        break;

      case "FALLIDO":
      case "REJECTED":
      case "CANCELLED":
      case "CANCELED":
        estadoFinal = EstadoPago.FALLIDO;
        break;

      // No existe PENDIENTE_VERIFICACION en el enum, lo mapeamos a PENDIENTE
      case "PENDIENTE_VERIFICACION":
      case "PENDIENTE":
      default:
        estadoFinal = EstadoPago.PENDIENTE;
        break;
    }

    const repo = AppDataSource.getRepository(Pedido);
    const result = await repo.update({ id }, { estadoPago: estadoFinal });

    if (result.affected === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    return res.json({
      ok: true,
      pedidoId: id,
      nuevoEstadoPago: estadoFinal,
    });
  } catch (e: any) {
    console.error("Error al actualizar estado_pago:", e);
    return res.status(500).json({ error: "No se pudo actualizar el estado de pago" });
  }
});

export default router;
