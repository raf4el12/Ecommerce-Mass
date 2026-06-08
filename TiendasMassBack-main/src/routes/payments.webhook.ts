// src/routes/payments.webhook.ts
import { Router } from 'express';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { AppDataSource } from '../config/data-source';
import { Pedido, EstadoPago } from '../entities/Pedidos.entity';

const router = Router();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

/** MP status -> EstadoPago (enum de tu entidad Pedido) */
const mpToEstadoPago = (mpStatus?: string): EstadoPago => {
  const s = (mpStatus || '').toLowerCase();

  if (s === 'approved' || s === 'accredited') {
    return EstadoPago.COMPLETADO;
  }

  if (s === 'rejected' || s === 'cancelled' || s === 'canceled') {
    return EstadoPago.FALLIDO;
  }

  // pending, in_process, authorized, etc.
  return EstadoPago.PENDIENTE;
};

/** Extrae (type, paymentId) desde body/query en formatos comunes de MP */
function extractTypeAndId(req: any): { type?: string; paymentId?: string } {
  let type: string | undefined;
  let paymentId: string | undefined;

  // Webhook v2 (POST JSON): { type:'payment', data:{ id:'123' } }
  if (req.body) {
    type = req.body?.type ?? req.body?.topic ?? type;
    paymentId = req.body?.data?.id ?? paymentId;
  }

  // A veces viene por query (?type=payment&id=123) o (?topic=payment&id=123)
  if (!type && typeof req.query?.type === 'string') type = req.query.type;
  if (!type && typeof req.query?.topic === 'string') type = req.query.topic;
  if (!paymentId && typeof req.query?.id === 'string') paymentId = req.query.id;

  // Algunos envíos raros: data.id en query (?data.id=123)
  if (!paymentId && typeof req.query?.['data.id'] === 'string') {
    paymentId = req.query['data.id'] as string;
  }

  return { type, paymentId };
}

/** Handler principal: actualiza estadoPago a partir del pago en MP */
async function handleMpNotification(req: any, res: any) {
  try {
    const { type, paymentId } = extractTypeAndId(req);

    if (type === 'payment' && paymentId) {
      const payment = await new Payment(client).get({ id: paymentId });

      // orderId puede venir en metadata.orderId o en external_reference
      const rawOrderId =
        (payment.metadata as any)?.orderId ?? payment.external_reference;
      const orderId = rawOrderId ? Number(rawOrderId) : NaN;

      const statusMp = payment.status; // approved | pending | rejected | ...
      const statusDetail = payment.status_detail;

      console.log('🔔 MP webhook', {
        orderId,
        paymentId,
        statusMp,
        statusDetail,
      });

      if (orderId && !Number.isNaN(orderId)) {
        const repo = AppDataSource.getRepository(Pedido);

        await repo.update(
          { id: orderId },
          { estadoPago: mpToEstadoPago(statusMp) },
        );
      } else {
        console.warn('⚠️ MP webhook: orderId inválido', {
          rawOrderId,
          paymentId,
        });
      }
    } else {
      console.log('Webhook ignorado (sin type/paymentId válidos)', {
        body: req.body,
        query: req.query,
      });
    }

    // SIEMPRE 200 para evitar reintentos agresivos de MP
    return res.sendStatus(200);
  } catch (e: any) {
    console.error('MP webhook error:', e?.message || e);
    // Igual devolvemos 200 para que MP no haga retry infinito
    return res.sendStatus(200);
  }
}

// MP puede llamar por POST o GET
router.post('/webhook', handleMpNotification);
router.get('/webhook', handleMpNotification);

export default router;
