import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Kardex, TipoMovimiento } from '../entities/Kardex.entity';
import { Producto } from '../entities/Producto.entity';
import { Usuario } from '../entities/Usuario.entity';
import { ApiError } from '../middlewares/errorHandler';

export interface RegistrarMovimientoDto {
  producto_id: number;
  tipo_movimiento: TipoMovimiento;
  cantidad: number; // debe ser un número positivo, nosotros lo sumamos o restamos según el tipo
  motivo: string;
  referencia_id?: string;
  usuario_id?: number;
}

export class KardexService {
  private kardexRepository: Repository<Kardex>;

  constructor() {
    this.kardexRepository = AppDataSource.getRepository(Kardex);
  }

  public async getAll(productoId?: string, tipoMovimiento?: string) {
    const query = this.kardexRepository.createQueryBuilder('kardex')
      .leftJoinAndSelect('kardex.producto', 'producto')
      .leftJoinAndSelect('kardex.usuario', 'usuario')
      .orderBy('kardex.creadoEn', 'DESC');

    if (productoId) {
      query.andWhere('producto.id = :productoId', { productoId: parseInt(productoId) });
    }

    if (tipoMovimiento) {
      query.andWhere('kardex.tipo_movimiento = :tipoMovimiento', { tipoMovimiento });
    }

    return await query.getMany();
  }

  public async getByProducto(productoId: number) {
    return await this.kardexRepository.find({
      where: { producto: { id: productoId } },
      order: { creadoEn: 'DESC' },
      relations: ['producto', 'usuario']
    });
  }

  public async registrarMovimiento(data: RegistrarMovimientoDto): Promise<Kardex> {
    if (data.cantidad <= 0) {
      throw new ApiError('La cantidad debe ser mayor a 0', 400);
    }

    // Ejecutamos en una transacción para garantizar consistencia
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const producto = await transactionalEntityManager.findOne(Producto, {
        where: { id: data.producto_id }
      });

      if (!producto) {
        throw new ApiError('Producto no encontrado', 404);
      }

      let usuario = null;
      if (data.usuario_id) {
        usuario = await transactionalEntityManager.findOne(Usuario, {
          where: { id: data.usuario_id }
        });
      }

      const stockAnterior = producto.stock;
      let stockNuevo = stockAnterior;

      if (data.tipo_movimiento === TipoMovimiento.ENTRADA) {
        stockNuevo += data.cantidad;
      } else if (data.tipo_movimiento === TipoMovimiento.SALIDA) {
        if (stockAnterior < data.cantidad) {
          throw new ApiError('Stock insuficiente para realizar la salida', 400);
        }
        stockNuevo -= data.cantidad;
      } else if (data.tipo_movimiento === TipoMovimiento.AJUSTE) {
        // En ajuste, podemos mandar una cantidad que representa la diferencia (positiva o negativa)
        // Por simplicidad, asumimos que un ajuste con cantidad X simplemente setea el nuevo stock a X, o suma/resta según signo.
        // Pero en la DTO dijimos que cantidad es positiva, entonces AJUSTE requerirá especificar si es Entrada o Salida?
        // En este diseño: un AJUSTE re-establece el stock a la cantidad enviada.
        stockNuevo = data.cantidad; 
      }

      // 1. Actualizar el producto
      producto.stock = stockNuevo;
      await transactionalEntityManager.save(Producto, producto);

      // 2. Registrar en el Kardex
      const cantidadRegistrada = data.tipo_movimiento === TipoMovimiento.AJUSTE 
        ? Math.abs(stockNuevo - stockAnterior)
        : data.cantidad;

      const nuevoKardex = transactionalEntityManager.create(Kardex, {
        producto,
        tipo_movimiento: data.tipo_movimiento,
        cantidad: cantidadRegistrada,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        motivo: data.motivo,
        referencia_id: data.referencia_id,
        usuario
      });

      return await transactionalEntityManager.save(Kardex, nuevoKardex);
    });
  }
}

export const kardexService = new KardexService();
