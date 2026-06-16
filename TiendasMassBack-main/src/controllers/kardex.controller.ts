import { Request, Response, NextFunction } from 'express';
import { kardexService, RegistrarMovimientoDto } from '../services/kardex.service';

export class KardexController {
  
  public getAllKardex = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productoId = req.query.productoId as string;
      const tipoMovimiento = req.query.tipoMovimiento as string;
      
      const movimientos = await kardexService.getAll(productoId, tipoMovimiento);
      res.json(movimientos);
    } catch (error) {
      next(error);
    }
  };

  public getByProductoId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.productoId);
      if (isNaN(id)) {
        res.status(400).json({ message: 'ID de producto inválido' });
        return;
      }

      const movimientos = await kardexService.getByProducto(id);
      res.json(movimientos);
    } catch (error) {
      next(error);
    }
  };

  public registrarMovimiento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Nota: En un sistema real extraerías el usuario_id del JWT: const usuario_id = req.user.id;
      // Para efectos del ejemplo, lo tomamos del body o lo ignoramos.
      const data: RegistrarMovimientoDto = {
        producto_id: req.body.producto_id,
        tipo_movimiento: req.body.tipo_movimiento,
        cantidad: req.body.cantidad,
        motivo: req.body.motivo,
        referencia_id: req.body.referencia_id,
        usuario_id: req.body.usuario_id
      };

      const movimiento = await kardexService.registrarMovimiento(data);
      res.status(201).json(movimiento);
    } catch (error) {
      next(error);
    }
  };
}

const kardexController = new KardexController();

export const {
  getAllKardex,
  getByProductoId,
  registrarMovimiento
} = kardexController;
