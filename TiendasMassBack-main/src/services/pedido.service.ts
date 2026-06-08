import { AppDataSource } from '../config/data-source';
import { Pedido, EstadoPedido, EstadoPago } from '../entities/Pedidos.entity';
import { DetallePedido } from '../entities/DetallePedido.entity';
import { Usuario } from '../entities/Usuario.entity';
import { Producto } from '../entities/Producto.entity';
import { MetodoPago } from '../entities/MetodoPago.entity';
import { MetodoEnvio } from '../entities/MetodoEnvio.entity';
import { Direccion } from '../entities/Direccion.entity';
import { ApiError } from '../middlewares/errorHandler';

export interface CrearPedidoDto {
  usuarioId: number;
  direccionEnvio?: string;
  direccionId?: number;
  metodoPagoId: number;
  detalles: Array<{ productoId: number; cantidad: number }>;
  montoTotal: number;
  deliveryType: 'delivery' | 'pickup';
  metodoEnvioId?: number;
}

export class PedidoService {
  private pedidoRepo = AppDataSource.getRepository(Pedido);
  private usuarioRepo = AppDataSource.getRepository(Usuario);
  private productoRepo = AppDataSource.getRepository(Producto);
  private detalleRepo = AppDataSource.getRepository(DetallePedido);
  private metodoPagoRepo = AppDataSource.getRepository(MetodoPago);
  private metodoEnvioRepo = AppDataSource.getRepository(MetodoEnvio);
  private direccionRepo = AppDataSource.getRepository(Direccion);

  public async crearPedido(data: CrearPedidoDto) {
    const usuario = await this.usuarioRepo.findOneBy({ id: data.usuarioId });
    if (!usuario) throw new ApiError('Usuario no encontrado', 404);

    const metodoPago = await this.metodoPagoRepo.findOneBy({ id: data.metodoPagoId });
    if (!metodoPago) throw new ApiError('Método de pago inválido', 400);

    if (!data.detalles || data.detalles.length === 0) {
      throw new ApiError('El pedido debe contener al menos un producto', 400);
    }

    let metodoEnvio: MetodoEnvio | null = null;
    let direccionSeleccionada: Direccion | null = null;

    if (data.deliveryType === 'delivery') {
      if (data.metodoEnvioId) {
        metodoEnvio = await this.metodoEnvioRepo.findOneBy({ id: data.metodoEnvioId });
      } else {
        metodoEnvio = await this.metodoEnvioRepo.findOne({ where: {}, order: { id: 'ASC' } });
      }
      if (!metodoEnvio) throw new ApiError('Método de envío inválido', 400);

      if (data.direccionId) {
        direccionSeleccionada = await this.direccionRepo.findOneBy({ id: data.direccionId });
        if (!direccionSeleccionada || direccionSeleccionada.usuarioId !== data.usuarioId || !direccionSeleccionada.activa) {
          throw new ApiError('Dirección de envío inválida', 400);
        }
      }
    }

    let subtotalCalculado = 0;
    const productosMap = new Map<number, Producto>();

    for (const det of data.detalles) {
      const producto = await this.productoRepo.findOneBy({ id: det.productoId });
      if (!producto || producto.stock < det.cantidad) {
        throw new ApiError(`Producto sin stock o inválido (ID ${det.productoId})`, 400);
      }
      productosMap.set(producto.id, producto);
      subtotalCalculado += Number(producto.precio) * det.cantidad;
    }

    subtotalCalculado = Number(subtotalCalculado.toFixed(2));
    const impuestos = Number((subtotalCalculado * 0.08).toFixed(2));
    const envio = data.deliveryType === 'delivery' && metodoEnvio ? Number(metodoEnvio.precio) : 0;
    const base = Number((subtotalCalculado + impuestos + envio).toFixed(2));

    const porcentaje = metodoPago?.comision != null ? Number(metodoPago.comision) / 100 : 0;
    const comision = Number((base * porcentaje).toFixed(2));
    const montoEsperado = Number((base + comision).toFixed(2));

    if (Math.abs(Number(data.montoTotal) - montoEsperado) > 0.01) {
      throw new ApiError(`El monto total enviado (${Number(data.montoTotal).toFixed(2)}) no coincide con el calculado (${montoEsperado.toFixed(2)}).`, 400);
    }

    const direccionTexto = direccionSeleccionada
      ? `${direccionSeleccionada.nombre} - ${direccionSeleccionada.calle}, ${direccionSeleccionada.ciudad} ${direccionSeleccionada.codigoPostal}`
      : (data.direccionEnvio || '');

    const nuevoPedido = this.pedidoRepo.create({
      usuario,
      direccionEnvio: direccionTexto,
      direccion: direccionSeleccionada || undefined,
      metodoPago,
      shippingMethod: metodoEnvio,
      estado: EstadoPedido.PENDIENTE,
      montoTotal: montoEsperado,
      estadoPago: EstadoPago.PENDIENTE,
      fechaEnvio: undefined
    } as any);

    // Usar query runner para transacciones sería ideal aquí en el futuro
    const pedidoGuardado = await this.pedidoRepo.save(nuevoPedido);

    for (const det of data.detalles) {
      const producto = productosMap.get(det.productoId)!;
      producto.stock = Number(producto.stock) - det.cantidad;
      await this.productoRepo.save(producto);

      const nuevoDetalle = this.detalleRepo.create({
        pedido: pedidoGuardado as any,
        producto,
        cantidad: det.cantidad,
        precio: Number(producto.precio)
      });
      await this.detalleRepo.save(nuevoDetalle);
    }

    return {
      mensaje: 'Pedido creado con éxito',
      pedidoId: (pedidoGuardado as any).id,
      estado_pago: (pedidoGuardado as any).estadoPago
    };
  }

  public async obtenerPedidos() {
    return this.pedidoRepo.find({
      relations: ['usuario', 'detallesPedidos', 'detallesPedidos.producto', 'metodoPago', 'shippingMethod', 'direccion']
    });
  }

  public async obtenerPedidoPorId(id: number) {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: ['usuario', 'detallesPedidos', 'detallesPedidos.producto', 'metodoPago', 'shippingMethod', 'direccion']
    });

    if (!pedido) throw new ApiError('Pedido no encontrado', 404);

    return {
      id: pedido.id,
      estado: pedido.estado,
      estado_pago: pedido.estadoPago,
      montoTotal: Number(pedido.montoTotal),
      direccionEnvio: pedido.direccionEnvio,
      direccion: pedido.direccion,
      usuario: pedido.usuario ? { id: pedido.usuario.id, nombre: pedido.usuario.nombre, email: pedido.usuario.email } : null,
      metodoPago: pedido.metodoPago ? { id: pedido.metodoPago.id, nombre: (pedido.metodoPago as any).nombre, tipo: (pedido.metodoPago as any).tipo, comision: (pedido.metodoPago as any).comision } : null,
      shippingMethod: pedido.shippingMethod ? { id: pedido.shippingMethod.id, nombre: pedido.shippingMethod.nombre, precio: Number(pedido.shippingMethod.precio) } : null,
      detallesPedidos: (pedido.detallesPedidos || []).map((d) => ({
        id: d.id,
        cantidad: d.cantidad,
        precio: Number(d.precio),
        producto: d.producto ? { id: d.producto.id, nombre: d.producto.nombre } : null
      }))
    };
  }

  public async actualizarEstado(id: number, estado: string) {
    const pedido = await this.pedidoRepo.findOneBy({ id });
    if (!pedido) throw new ApiError('Pedido no encontrado', 404);

    if (!Object.values(EstadoPedido).includes(estado as any)) {
      throw new ApiError('Estado inválido', 400);
    }

    pedido.estado = estado as EstadoPedido;
    return this.pedidoRepo.save(pedido);
  }

  public async eliminarPedido(id: number) {
    const pedido = await this.pedidoRepo.findOneBy({ id });
    if (!pedido) throw new ApiError('Pedido no encontrado', 404);

    await this.pedidoRepo.remove(pedido);
    return { mensaje: 'Pedido eliminado con éxito' };
  }

  public async obtenerPedidosPorUsuario(usuarioId: number) {
    const usuario = await this.usuarioRepo.findOneBy({ id: usuarioId });
    if (!usuario) throw new ApiError('Usuario no encontrado', 404);

    const pedidos = await this.pedidoRepo.find({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario', 'detallesPedidos', 'detallesPedidos.producto', 'metodoPago', 'shippingMethod', 'direccion'],
      order: { id: 'DESC' }
    });

    return {
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      pedidos
    };
  }

  public async obtenerEstadisticas() {
    const pedidos = await this.pedidoRepo.find({
      relations: ['detallesPedidos']
    });

    const totalPedidos = pedidos.length;
    const ventasTotales = pedidos.reduce((sum, p) => sum + Number(p.montoTotal), 0);

    const estadisticasPorEstado: Record<string, number> = {
      pendiente: 0, confirmado: 0, enviado: 0, entregado: 0, cancelado: 0
    };

    pedidos.forEach((p) => {
      estadisticasPorEstado[p.estado] = (estadisticasPorEstado[p.estado] || 0) + 1;
    });

    const totalArticulos = pedidos.reduce(
      (sum, p) => sum + p.detallesPedidos.reduce((acc, d) => acc + d.cantidad, 0), 0
    );

    return {
      totalPedidos,
      ventasTotales: Number(ventasTotales.toFixed(2)),
      estadisticasPorEstado,
      totalArticulos,
      pedidos
    };
  }
}

export const pedidoService = new PedidoService();
