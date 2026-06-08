import React, { useState } from 'react';
import { BookText, Send } from 'lucide-react';
import Swal from 'sweetalert2';

const initialForm = {
  tipo: 'reclamo',
  nombre: '', dni: '', domicilio: '', email: '', telefono: '',
  bien: 'producto', descripcionBien: '', monto: '',
  detalle: '', pedido: '',
};

const LibroReclamaciones = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (!/^\d{8}$/.test(form.dni)) e.dni = 'DNI inválido (8 dígitos)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido';
    if (!/^\d{6,9}$/.test(form.telefono)) e.telefono = 'Teléfono inválido';
    if (!form.domicilio.trim()) e.domicilio = 'Requerido';
    if (!form.detalle.trim()) e.detalle = 'Describe tu reclamo o queja';
    if (!form.pedido.trim()) e.pedido = 'Indica tu pedido o solicitud';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // NOTE: pendiente conectar a endpoint backend que registre la hoja con correlativo.
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    Swal.fire({
      icon: 'success',
      title: 'Hoja de reclamación registrada',
      html: 'Recibirás una copia en tu correo. Tu reclamo será atendido en un plazo no mayor a <strong>30 días calendario</strong>, conforme a ley.',
      confirmButtonColor: '#0033A0',
    });
    setForm(initialForm);
  };

  const fieldClass = (k) =>
    `w-full bg-surface-grey border-2 rounded-lg py-3 px-4 outline-none transition-colors focus:bg-white ${errors[k] ? 'border-error' : 'border-transparent focus:border-trust-blue'}`;

  const Radio = ({ name, value, label }) => (
    <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 cursor-pointer transition-colors font-label-bold text-label-bold ${form[name] === value ? 'border-trust-blue bg-trust-blue/5 text-trust-blue' : 'border-outline-variant text-on-surface-variant'}`}>
      <input type="radio" name={name} value={value} checked={form[name] === value} onChange={e => setField(name, e.target.value)} className="sr-only" />
      {label}
    </label>
  );

  return (
    <div className="w-full flex flex-col bg-surface-grey font-body-md text-on-surface min-h-screen">
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-section-gap w-full space-y-8">
        <section className="bg-surface rounded-2xl p-8 shadow-level-1">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-mass-yellow text-trust-blue mb-4">
            <BookText strokeWidth={2.5} />
          </span>
          <h1 className="font-headline-lg text-headline-lg text-trust-blue mb-2">Libro de Reclamaciones</h1>
          <p className="font-body-lg text-on-surface-variant">
            Conforme al Código de Protección y Defensa del Consumidor (Ley N.º 29571). Completa la hoja y registraremos tu
            reclamo o queja.
          </p>
        </section>

        <form onSubmit={handleSubmit} noValidate className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-level-1 flex flex-col gap-6">
          {/* Tipo */}
          <div>
            <span className="font-label-bold text-label-bold mb-2 block">Tipo de solicitud *</span>
            <div className="flex gap-3">
              <Radio name="tipo" value="reclamo" label="Reclamo" />
              <Radio name="tipo" value="queja" label="Queja" />
            </div>
            <p className="text-on-surface-variant text-sm mt-2">
              <strong>Reclamo:</strong> disconformidad con el producto/servicio. <strong>Queja:</strong> malestar respecto a la atención.
            </p>
          </div>

          {/* Consumidor */}
          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <legend className="font-headline-sm text-headline-sm text-on-surface mb-3">Datos del consumidor</legend>
            <div className="md:col-span-2">
              <label className="font-label-bold text-label-bold mb-2 block">Nombre completo *</label>
              <input className={fieldClass('nombre')} value={form.nombre} onChange={e => setField('nombre', e.target.value)} />
              {errors.nombre && <p className="text-error text-sm mt-1">{errors.nombre}</p>}
            </div>
            <div>
              <label className="font-label-bold text-label-bold mb-2 block">DNI *</label>
              <input className={fieldClass('dni')} value={form.dni} onChange={e => setField('dni', e.target.value)} maxLength={8} inputMode="numeric" />
              {errors.dni && <p className="text-error text-sm mt-1">{errors.dni}</p>}
            </div>
            <div>
              <label className="font-label-bold text-label-bold mb-2 block">Teléfono *</label>
              <input className={fieldClass('telefono')} value={form.telefono} onChange={e => setField('telefono', e.target.value)} inputMode="numeric" />
              {errors.telefono && <p className="text-error text-sm mt-1">{errors.telefono}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="font-label-bold text-label-bold mb-2 block">Correo electrónico *</label>
              <input type="email" className={fieldClass('email')} value={form.email} onChange={e => setField('email', e.target.value)} />
              {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="font-label-bold text-label-bold mb-2 block">Domicilio *</label>
              <input className={fieldClass('domicilio')} value={form.domicilio} onChange={e => setField('domicilio', e.target.value)} />
              {errors.domicilio && <p className="text-error text-sm mt-1">{errors.domicilio}</p>}
            </div>
          </fieldset>

          {/* Bien contratado */}
          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <legend className="font-headline-sm text-headline-sm text-on-surface mb-3">Identificación del bien contratado</legend>
            <div>
              <label className="font-label-bold text-label-bold mb-2 block">Tipo</label>
              <div className="flex gap-3">
                <Radio name="bien" value="producto" label="Producto" />
                <Radio name="bien" value="servicio" label="Servicio" />
              </div>
            </div>
            <div>
              <label className="font-label-bold text-label-bold mb-2 block">Monto reclamado (S/)</label>
              <input className={fieldClass('monto')} value={form.monto} onChange={e => setField('monto', e.target.value)} inputMode="decimal" placeholder="0.00" />
            </div>
            <div className="md:col-span-2">
              <label className="font-label-bold text-label-bold mb-2 block">Descripción del producto/servicio</label>
              <input className={fieldClass('descripcionBien')} value={form.descripcionBien} onChange={e => setField('descripcionBien', e.target.value)} />
            </div>
          </fieldset>

          {/* Detalle */}
          <fieldset className="flex flex-col gap-5">
            <legend className="font-headline-sm text-headline-sm text-on-surface mb-3">Detalle</legend>
            <div>
              <label className="font-label-bold text-label-bold mb-2 block">Detalle del reclamo o queja *</label>
              <textarea rows={4} className={fieldClass('detalle')} value={form.detalle} onChange={e => setField('detalle', e.target.value)} />
              {errors.detalle && <p className="text-error text-sm mt-1">{errors.detalle}</p>}
            </div>
            <div>
              <label className="font-label-bold text-label-bold mb-2 block">Pedido del consumidor *</label>
              <textarea rows={3} className={fieldClass('pedido')} value={form.pedido} onChange={e => setField('pedido', e.target.value)} placeholder="¿Qué solución esperas?" />
              {errors.pedido && <p className="text-error text-sm mt-1">{errors.pedido}</p>}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-trust-blue text-white font-label-bold text-label-bold rounded-full min-h-[48px] px-6 hover:bg-trust-blue-dark transition-colors shadow-level-1 hover:shadow-level-2 disabled:opacity-50"
          >
            <Send size={18} strokeWidth={2.5} />
            {submitting ? 'Registrando…' : 'Registrar hoja de reclamación'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default LibroReclamaciones;
