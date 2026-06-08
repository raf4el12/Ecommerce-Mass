// src/routes/payments.mp.ts
import { Router } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { AppDataSource } from '../config/data-source';
import { Pedido, EstadoPago } from '../entities/Pedidos.entity';

const router = Router();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

// BACKEND (443) – solo como fallback
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

// URLs del FRONT (5173)
const SUCCESS_URL = process.env.MP_SUCCESS_URL || 'http://localhost:5173/checkout/success';
const FAILURE_URL = process.env.MP_FAILURE_URL || 'http://localhost:5173/checkout/failure';
const PENDING_URL = process.env.MP_PENDING_URL || 'http://localhost:5173/checkout/pending';

// Webhook del backend
const NOTIF_URL = `${BASE_URL}/api/payments/mp/webhook`;

router.get('/preference/health', (_req, res) => {
  res.json({
    ok: true,
    BASE_URL,
    SUCCESS_URL,
    FAILURE_URL,
    PENDING_URL,
    accessTokenPresent: !!process.env.MP_ACCESS_TOKEN,
  });
});


// POST /api/payments/mp/preference
router.post('/preference', async (req, res) => {
  try {
    const { orderId, payerEmail, items } = req.body;

    console.log('🧾 Body recibido en /preference:', req.body);
    console.log('🔗 back_urls usadas para MP:', {
      SUCCESS_URL,
      FAILURE_URL,
      PENDING_URL,
      NOTIF_URL,
    });

    const normalizedItems = (items || []).map((it: any, i: number) => ({
      id: String(i + 1),
      title: String(it.title ?? `Item ${i + 1}`),
      quantity: Number(it.quantity ?? 1),
      unit_price: Number(it.unit_price ?? 0),
      currency_id: 'PEN',
    }));

    console.log('🧾 Items normalizados para MP:', normalizedItems);

    // auto_return SOLO funciona si SUCCESS_URL es HTTPS real
    // En dev (ngrok + localhost:5173) SUCCESS_URL es HTTP, así que NO usamos auto_return
    const hasHttpsSuccessUrl = SUCCESS_URL.startsWith('https://');
    
    const body: any = {
      items: normalizedItems,
      payer: payerEmail ? { email: payerEmail } : undefined,
      metadata: { orderId },
      external_reference: orderId ? String(orderId) : undefined,
      back_urls: {
        success: SUCCESS_URL,
        failure: FAILURE_URL,
        pending: PENDING_URL,
      },
      // auto_return SOLO si SUCCESS_URL es HTTPS (producción real)
      ...(hasHttpsSuccessUrl && { auto_return: 'approved' }),
      // binary_mode: solo aprobado o rechazado (sin pending)
      binary_mode: process.env.MP_BINARY_MODE === 'true',
      notification_url: NOTIF_URL,
      statement_descriptor: 'TIENDAS MASS',
    };

    const pref = await new Preference(client).create({ body });

    console.log('✅ Preferencia creada OK:', {
      id: pref.id,
      init_point: pref.init_point,
      sandbox_init_point: (pref as any).sandbox_init_point,
      auto_return_enabled: hasHttpsSuccessUrl,
    });

    // En dev, devolver sandbox_init_point; en prod, init_point normal
    const useSandbox = !hasHttpsSuccessUrl && !!(pref as any).sandbox_init_point;
    const initPoint = useSandbox ? (pref as any).sandbox_init_point : pref.init_point;

    res.json({
      id: pref.id,
      init_point: initPoint,
      sandbox_init_point: (pref as any).sandbox_init_point ?? null,
      auto_return_enabled: hasHttpsSuccessUrl,
      useSandbox,
    });
  } catch (e: any) {
    console.error('❌ MP preference error (objeto completo):', e);
    res.status(500).json({
      error: 'No se pudo crear la preferencia de Mercado Pago',
      debug: {
        message: e?.message ?? null,
        cause: e?.cause ?? null,
        status: e?.status ?? null,
      },
    });
  }
});

// GET /api/payments/mp/success - Redirige a success page del frontend
// MercadoPago llama a esta URL HTTPS (via ngrok) después de pago exitoso
router.get('/success', (_req, res) => {
  const query = _req.query;
  const prefId = String(query.preference_id || query.id || '');
  const paymentId = String(query.payment_id || '');
  const collectionId = String(query.collection_id || '');

  console.log('✅ MP Success recibido:', { prefId, paymentId, collectionId });

  // Redirige al frontend (localhost) con el preference_id
  res.set('ngrok-skip-browser-warning', 'true');
  res.redirect(302, `http://localhost:5173/checkout/success?payment_id=${prefId || paymentId || collectionId}`);
});

// GET /api/payments/mp/failure - Redirige a failure page del frontend
router.get('/failure', (_req, res) => {
  const query = _req.query;
  const reason = String(query.reason || 'Tu pago fue rechazado o cancelado.');

  console.log('❌ MP Failure recibido:', { reason });

  res.set('ngrok-skip-browser-warning', 'true');
  res.redirect(302, `http://localhost:5173/checkout/failure?reason=${encodeURIComponent(reason)}`);
});

// GET /api/payments/mp/pending - Redirige a pending page del frontend
router.get('/pending', (_req, res) => {
  const query = _req.query;
  const prefId = String(query.preference_id || query.id || '');

  console.log('⏳ MP Pending recibido:', { prefId });

  res.set('ngrok-skip-browser-warning', 'true');
  res.redirect(302, `http://localhost:5173/checkout/pending?payment_id=${prefId}`);
});

// GET /api/payments/mp/auto-redirect - Auto-redirige desde la página de éxito de MercadoPago
// Esto se usa cuando MercadoPago no puede hacer auto_return (ej: localhost HTTP)
router.get('/auto-redirect', (_req, res) => {
  const query = _req.query;
  const prefId = query.preference_id || query.id || '';
  const paymentId = query.payment_id || '';
  const status = query.collection_status || 'approved';

  console.log('🔀 Auto-Redirect desde MP:', { prefId, paymentId, status });

  // Devolver HTML que redirige automáticamente
  const redirectUrl = `${SUCCESS_URL}?payment_id=${prefId}`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirigiendo...</title>
      <script>
        // Redirige en 1 segundo
        setTimeout(() => {
          window.location.href = '${redirectUrl}';
        }, 1000);
      </script>
    </head>
    <body>
      <p>Redirigiendo a tu tienda...</p>
    </body>
    </html>
  `);
});

// POST /api/payments/mp/confirm - Verifica el pago desde el frontend
// El frontend lo llama para confirmar que el pago fue completado
// Recibe: preference_id (que es un string como "2957481232-xxxxx")
router.post('/confirm', async (req, res) => {
  try {
    const { paymentId, preferenceId } = req.body;
    const mpId = paymentId || preferenceId;

    if (!mpId) {
      return res.status(400).json({ error: 'paymentId o preferenceId requerido' });
    }

    console.log('✅ Confirmando pago MP:', { paymentId, preferenceId });

    // Si es un preference_id (contiene guion), buscar en el pedido
    // Si es un payment_id real, consultar MercadoPago
    
    if (String(mpId).includes('-')) {
      // Es un preference_id, buscar pedido que tenga este estado_pago actualizado
      console.log('🔍 Buscando pedido con preference_id:', mpId);
      
      // Esperar un poco a que el webhook actualice la BD (máximo 5 segundos)
      for (let i = 0; i < 5; i++) {
        const repo = AppDataSource.getRepository(Pedido);
        const pedido = await repo.findOne({ 
          where: { estadoPago: EstadoPago.COMPLETADO },
          order: { id: 'DESC' as any } as any,
        });

        if (pedido) {
          console.log('✅ Pedido encontrado y pagado:', pedido.id);
          return res.json({
            paymentId: mpId,
            statusMp: 'approved',
            statusDetail: 'accredited',
            orderId: pedido.id,
          });
        }

        // Esperar 1 segundo antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Si no encontró, devolver estado "pending"
      return res.json({
        paymentId: mpId,
        statusMp: 'pending',
        statusDetail: 'waiting_for_webhook',
        orderId: null,
      });
    } else {
      // Es un payment_id real, consultar MercadoPago
      const payment = await new Payment(client).get({
        id: mpId,
      });

      const statusMp = payment.status;
      const statusDetail = payment.status_detail;
      const externalRef = payment.external_reference;

      console.log('💳 Detalles del pago:', {
        statusMp,
        statusDetail,
        externalRef,
      });

      return res.json({
        paymentId: mpId,
        statusMp,
        statusDetail,
        orderId: externalRef || null,
      });
    }
  } catch (e: any) {
    console.error('❌ Error al confirmar pago:', e?.message);
    res.status(500).json({
      error: 'No se pudo confirmar el pago',
      message: e?.message,
    });
  }
});

export default router;
