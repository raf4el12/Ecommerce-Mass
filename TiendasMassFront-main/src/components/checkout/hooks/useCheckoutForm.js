// hooks/useCheckoutForm.js
import { useState, useEffect } from 'react';
import { useCarrito } from '../../../context/carContext';
import { useUsuario } from '../../../context/userContext';
import { checkoutService } from '../services/checkoutService';
import { paymentService } from '../services/paymentService';

export const useCheckoutForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    deliveryType: 'delivery',
    address: '',
    city: '',
    zipCode: '',
    country: 'Perú',
    reference: '',
    selectedStore: ''
  });

  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvv: '',
    nameOnCard: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [selectedMetodoEnvioId, setSelectedMetodoEnvioId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [shouldAdvanceStep, setShouldAdvanceStep] = useState(false);

  // Mercado Pago
  const [showMpWallet, setShowMpWallet] = useState(false);
  const [mpPrefId, setMpPrefId] = useState("");
  const [pollingId, setPollingId] = useState(null);

  const { carrito, vaciarCarrito } = useCarrito();
  const { usuario } = useUsuario();

  // Pre-llenar datos del usuario si está logueado
  useEffect(() => {
    if (usuario) {
      setFormData(prev => ({
        ...prev,
        fullName: usuario.nombre || '',
        email: usuario.email || '',
        phone: usuario.telefono || ''
      }));
    }
  }, [usuario]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCardInfo = (field, value) => {
    setCardInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (addressId) => {
    setSelectedAddressId(addressId);
    if (addressId === 'custom') {
      setUseCustomAddress(true);
    } else {
      setUseCustomAddress(false);
    }
  };

  const handlePaymentMethodChange = (type, value) => {
    if (type === 'userCard') {
      setPaymentMethod('userCard');
      setSelectedCardId(value);
    } else {
      setPaymentMethod(value);
      setSelectedCardId('');
    }
  };

  // Calcular totales
  const calculateTotals = (metodosEnvio, metodosPago) => {
    const parsePrice = (p) => (typeof p === 'number' ? p : (parseFloat(p) || 0));
    const subtotal = carrito.reduce((acc, it) => acc + parsePrice(it.precio) * (it.cantidad || 1), 0);

    // Si no hay método de envío seleccionado, usar el primero disponible
    const metodoEnvioId = selectedMetodoEnvioId || (metodosEnvio && metodosEnvio.length > 0 ? metodosEnvio[0].id : null);
    const selectedEnvio = metodosEnvio && metodoEnvioId ? metodosEnvio.find(m => m.id === metodoEnvioId) : null;
    const shippingCost = formData.deliveryType === 'pickup' ? 0 : (selectedEnvio ? parsePrice(selectedEnvio.precio) : 0);

    const impuestos = +(subtotal * 0.08).toFixed(2);

    const selectedMethodObj = paymentMethod === 'userCard'
      ? metodosPago.find(m => m.tipo === 'tarjeta' || m.nombre?.toLowerCase().includes('tarjeta'))
      : metodosPago.find(m => m.id?.toString() === paymentMethod);

    const porcentaje = selectedMethodObj?.comision ? Number(selectedMethodObj.comision) / 100 : 0;
    const baseParaComision = subtotal + impuestos + shippingCost;
    const comision = Math.round(baseParaComision * porcentaje * 100) / 100;

    const total = +(subtotal + impuestos + shippingCost + comision).toFixed(2);

    console.log('🧮 Cálculo de totales en frontend:', {
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      impuestos: impuestos.toFixed(2),
      comision: comision.toFixed(2),
      total: total.toFixed(2),
      metodoEnvioId,
      selectedEnvio: selectedEnvio ? { id: selectedEnvio.id, precio: selectedEnvio.precio } : null,
      selectedMetodoEnvioId,
      deliveryType: formData.deliveryType,
      selectedMethodObj: selectedMethodObj ? { id: selectedMethodObj.id, comision: selectedMethodObj.comision } : null
    });

    return { subtotal, shippingCost, impuestos, comision, total };
  };

  const buildMpItems = (totals) => {
    const items = carrito.map(it => ({
      title: it.title || it.nombre || `Item ${it.id}`,
      quantity: Number(it.cantidad || 1),
      unit_price: Number((it.precio || 0)),
    }));

    if (formData.deliveryType === 'delivery' && totals.shippingCost > 0) {
      items.push({
        title: 'Costo de Envío',
        quantity: 1,
        unit_price: Number(totals.shippingCost.toFixed(2)),
      });
    }

    if (totals.impuestos > 0) {
      items.push({
        title: 'Impuestos',
        quantity: 1,
        unit_price: Number(totals.impuestos.toFixed(2)),
      });
    }

    if (totals.comision > 0) {
      items.push({
        title: 'Comisión de pago',
        quantity: 1,
        unit_price: Number(totals.comision.toFixed(2)),
      });
    }

    return items;
  };

  const crearPedido = async (metodosEnvio, metodosPago, userAddresses, userCards) => {
    setLoading(true);
    setError('');

    try {
      if (!carrito?.length) throw new Error('El carrito está vacío');
      if (!formData.fullName || !formData.email || !formData.phone) throw new Error('Faltan datos requeridos del usuario');
      if (!paymentMethod) throw new Error('Debes seleccionar un método de pago');

      const totals = calculateTotals(metodosEnvio, metodosPago);

      console.log('📦 Carrito actual:', carrito.map(item => ({
        id: item.id,
        nombre: item.nombre || item.title,
        precio: item.precio,
        cantidad: item.cantidad,
        subtotal: (item.precio || 0) * item.cantidad
      })));

      let metodoPagoId = null;
      if (paymentMethod === 'userCard') {
        if (!selectedCardId) throw new Error('Debes seleccionar una tarjeta');
        metodoPagoId = metodosPago.find(m => m.tipo === 'tarjeta' || m.nombre?.toLowerCase().includes('tarjeta'))?.id || null;
      } else {
        metodoPagoId = parseInt(paymentMethod);
      }

      let direccionEnvio = '';
      let deliveryType = formData.deliveryType || 'delivery';
      let metodoEnvioId = null;

      if (deliveryType === 'delivery') {
        metodoEnvioId = selectedMetodoEnvioId || (metodosEnvio[0]?.id ?? null);

        console.log('🚚 Método de envío seleccionado:', {
          selectedMetodoEnvioId,
          metodoEnvioId,
          metodosEnvioDisponibles: metodosEnvio.map(m => ({ id: m.id, nombre: m.nombre, precio: m.precio }))
        });

        if (selectedAddressId && selectedAddressId !== 'custom') {
          const a = userAddresses.find(addr => addr.id.toString() === selectedAddressId);
          if (a) {
            direccionEnvio = `${a.calle}, ${a.ciudad} ${a.codigoPostal}${a.referencia ? ` (${a.referencia})` : ''}`;
          }
        }

        if (!direccionEnvio && (formData.address || formData.city)) {
          direccionEnvio = `${formData.address || ''}, ${formData.city || ''} ${formData.zipCode || ''}`.trim();
        }

        if (!direccionEnvio) throw new Error('Falta la dirección de entrega');
      } else {
        direccionEnvio = formData.selectedStore || 'Recojo en tienda';
      }

      const pedidoData = {
        usuarioId: usuario?.id || null,
        direccionEnvio,
        metodoPagoId,
        metodoEnvioId,
        deliveryType,
        montoTotal: totals.total,
        detalles: carrito.map(item => ({
          productoId: parseInt(item.id),
          cantidad: parseInt(item.cantidad)
        }))
      };

      // Si el usuario seleccionó una dirección guardada, incluir su id
      if (selectedAddressId && selectedAddressId !== 'custom') {
        pedidoData.direccionId = parseInt(selectedAddressId);
      }

      if (paymentMethod === 'userCard' && selectedCardId) {
        const c = userCards.find(card => card.id.toString() === selectedCardId);
        if (c) {
          pedidoData.tarjetaInfo = {
            tarjetaId: c.id,
            tipoTarjeta: c.tipoTarjeta,
            numeroEnmascarado: c.numeroEnmascarado,
            fechaVencimiento: c.fechaVencimiento,
            nombreEnTarjeta: c.nombreEnTarjeta
          };
        }
      }

      console.log('📦 Enviando datos adaptados:', JSON.stringify(pedidoData, null, 2));

      const result = await checkoutService.crearPedido(pedidoData, usuario?.token);

      const estadoPagoCalculado = paymentService.determinePaymentStatus(result, paymentMethod, metodosPago);

      const detallesPedidos = carrito.map((item, index) => ({
        id: `detalle_${(result.pedidoId || result.id)}_${index}`,
        cantidad: item.cantidad,
        precio: item.precio || 0,
        subtotal: (item.precio || 0) * item.cantidad,
        producto: { id: item.id, nombre: item.nombre || item.title || 'Producto sin nombre' }
      }));

      const metodoSeleccionado = metodosPago.find(m => m.id.toString() === paymentMethod);

      setPedidoCreado({
        id: result.pedidoId || result.id,
        montoTotal: result.montoTotal || totals.total,
        direccionEnvio: result.direccionEnvio || pedidoData.direccionEnvio,
        estado: result.estado || 'PENDIENTE',
        estadoPago: estadoPagoCalculado,
        metodoPago: {
          id: metodoPagoId,
          nombre: metodoSeleccionado?.nombre || result.metodoPago?.nombre || 'Método no especificado'
        },
        detallesPedidos,
        resumen: { items: detallesPedidos, ...totals }
      });

      if (paymentService.isMpMethod(metodoSeleccionado)) {
        const orderId = result.pedidoId || result.id;
        const mpItems = buildMpItems(totals);
        const prefId = await paymentService.crearPreferenciaMp(orderId, formData.email, mpItems);
        setMpPrefId(prefId);
        setShowMpWallet(true);

        const pollingId = paymentService.startPollingOrder(
          orderId,
          (data) => {
            setPollingId(null);
            setPedidoCreado(prev => prev ? { ...prev, estadoPago: 'COMPLETADO', estado: data.estado || prev.estado } : prev);
            if (vaciarCarrito) vaciarCarrito();
            setShowMpWallet(false);
            // Redirect to success
            setTimeout(() => {
              window.location.href = `/checkout/success?payment_id=${data.id || orderId}`;
            }, 2000);
          },
          (errorMsg) => {
            setPollingId(null);
            setShowMpWallet(false);
            setError(errorMsg);
            setTimeout(() => {
              window.location.href = `/checkout/failure?reason=${encodeURIComponent(errorMsg)}`;
            }, 2000);
          },
          (timeoutMsg) => {
            setPollingId(null);
            setShowMpWallet(false);
            setError(timeoutMsg);
          }
        );
        setPollingId(pollingId);
        return;
      }

      // 🆕 Para métodos NO-MP (efectivo, transferencia, etc), avanzar a Step 3
      if (vaciarCarrito) vaciarCarrito();
      setShouldAdvanceStep(true);

    } catch (e) {
      console.error('💥 Error:', e);
      const msg = (e && e.message) || String(e);
      if (msg.includes('Usuario no encontrado')) setError('Debes estar registrado para realizar un pedido. Por favor inicia sesión.');
      else if (msg.includes('Método de pago inválido')) setError('Método de pago no válido. Por favor selecciona otro.');
      else if (msg.includes('stock')) setError('Algunos productos no tienen stock suficiente. Revisa tu carrito.');
      else if (msg.includes('El monto total enviado')) setError(msg);
      else setError(msg || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    cardInfo,
    paymentMethod,
    selectedCardId,
    selectedAddressId,
    useCustomAddress,
    selectedMetodoEnvioId,
    loading,
    error,
    pedidoCreado,
    showMpWallet,
    mpPrefId,
    shouldAdvanceStep,
    setShouldAdvanceStep,
    updateFormData,
    updateCardInfo,
    handleAddressChange,
    handlePaymentMethodChange,
    setSelectedMetodoEnvioId,
    setError,
    crearPedido,
    calculateTotals
  };
};