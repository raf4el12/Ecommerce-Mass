import { Request, Response, NextFunction } from 'express';
import { pedidoService } from '../services/pedido.service';

export const crearPedido = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = {
      usuarioId: req.body.usuarioId,
      direccionEnvio: req.body.direccionEnvio,
      direccionId: req.body.direccionId,
      metodoPagoId: req.body.metodoPagoId,
      detalles: req.body.detalles || [],
      montoTotal: req.body.montoTotal,
      deliveryType: req.body.deliveryType,
      metodoEnvioId: req.body.metodoEnvioId
    };

    const resultado = await pedidoService.crearPedido(data);
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
};

export const obtenerPedidos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pedidos = await pedidoService.obtenerPedidos();
    res.json(pedidos);
  } catch (error) {
    next(error);
  }
};

export const obtenerPedidoPorId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de pedido inválido' });
      return;
    }
    const pedido = await pedidoService.obtenerPedidoPorId(id);
    res.json(pedido);
  } catch (error) {
    next(error);
  }
};

export const actualizarEstadoPedido = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de pedido inválido' });
      return;
    }
    const { estado } = req.body;
    const pedido = await pedidoService.actualizarEstado(id, estado);
    res.json(pedido);
  } catch (error) {
    next(error);
  }
};

export const eliminarPedido = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de pedido inválido' });
      return;
    }
    const resultado = await pedidoService.eliminarPedido(id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export const obtenerPedidosPorUsuario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = parseInt(req.params.usuarioId);
    if (isNaN(usuarioId)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }
    const pedidos = await pedidoService.obtenerPedidosPorUsuario(usuarioId);
    res.json(pedidos);
  } catch (error) {
    next(error);
  }
};

export const obtenerEstadisticasPedidos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const estadisticas = await pedidoService.obtenerEstadisticas();
    res.json(estadisticas);
  } catch (error) {
    next(error);
  }
};