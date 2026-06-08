import React, { useState } from 'react';
import { Briefcase, User, Mail, Phone, IdCard, Send } from 'lucide-react';
import Swal from 'sweetalert2';

const PUESTOS = ['Asistente de tienda', 'Cajero(a)', 'Almacenero(a)', 'Supervisor(a)', 'Reponedor(a)', 'Otro'];

const initialForm = { nombre: '', dni: '', email: '', telefono: '', puesto: '', mensaje: '', mayorDeEdad: false };

const TrabajaConNosotros = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'Ingresa tu nombre completo';
    if (!/^\d{8}$/.test(form.dni)) e.dni = 'DNI inválido (8 dígitos)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido';
    if (!/^\d{9}$/.test(form.telefono)) e.telefono = 'Teléfono inválido (9 dígitos)';
    if (!form.puesto) e.puesto = 'Selecciona un puesto';
    if (!form.mayorDeEdad) e.mayorDeEdad = 'Debes ser mayor de 18 años';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // NOTE: pendiente conectar a endpoint de postulaciones en backend.
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    Swal.fire({
      icon: 'success',
      title: '¡Postulación enviada!',
      text: 'Gracias por sumarte a la Fuerza Amarilla. Revisaremos tu información y te contactaremos pronto.',
      confirmButtonColor: '#0033A0',
    });
    setForm(initialForm);
  };

  const fieldClass = (k) =>
    `w-full bg-surface-grey border-2 rounded-lg py-3 px-4 outline-none transition-colors focus:bg-white ${errors[k] ? 'border-error' : 'border-transparent focus:border-trust-blue'}`;

  return (
    <div className="w-full flex flex-col bg-surface-grey font-body-md text-on-surface min-h-screen">
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-section-gap w-full space-y-8">
        <section className="bg-surface rounded-2xl p-8 shadow-level-1">
          <span className="inline-flex items-center gap-2 bg-mass-yellow text-trust-blue px-4 py-2 rounded-full font-label-bold text-label-bold mb-4">
            <Briefcase size={18} strokeWidth={2.5} /> FUERZA AMARILLA
          </span>
          <h1 className="font-headline-lg text-headline-lg text-trust-blue mb-2">Trabaja con nosotros</h1>
          <p className="font-body-lg text-on-surface-variant">
            ¿Tienes 18 años a más, te apasiona el trabajo en equipo y muchas ganas de crecer? Completa el formulario y únete.
            Nuestras convocatorias son <strong>100% gratuitas</strong>.
          </p>
        </section>

        <form onSubmit={handleSubmit} noValidate className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-level-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 font-label-bold text-label-bold mb-2"><User size={16} /> Nombre completo *</label>
            <input className={fieldClass('nombre')} value={form.nombre} onChange={e => setField('nombre', e.target.value)} />
            {errors.nombre && <p className="text-error text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 font-label-bold text-label-bold mb-2"><IdCard size={16} /> DNI *</label>
            <input className={fieldClass('dni')} value={form.dni} onChange={e => setField('dni', e.target.value)} maxLength={8} inputMode="numeric" placeholder="12345678" />
            {errors.dni && <p className="text-error text-sm mt-1">{errors.dni}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 font-label-bold text-label-bold mb-2"><Phone size={16} /> Teléfono *</label>
            <input className={fieldClass('telefono')} value={form.telefono} onChange={e => setField('telefono', e.target.value)} maxLength={9} inputMode="numeric" placeholder="987654321" />
            {errors.telefono && <p className="text-error text-sm mt-1">{errors.telefono}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 font-label-bold text-label-bold mb-2"><Mail size={16} /> Correo electrónico *</label>
            <input type="email" className={fieldClass('email')} value={form.email} onChange={e => setField('email', e.target.value)} placeholder="tucorreo@ejemplo.com" />
            {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="font-label-bold text-label-bold mb-2 block">Puesto de interés *</label>
            <select className={fieldClass('puesto')} value={form.puesto} onChange={e => setField('puesto', e.target.value)}>
              <option value="">Selecciona un puesto</option>
              {PUESTOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.puesto && <p className="text-error text-sm mt-1">{errors.puesto}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="font-label-bold text-label-bold mb-2 block">Cuéntanos sobre ti (opcional)</label>
            <textarea rows={4} className={fieldClass('mensaje')} value={form.mensaje} onChange={e => setField('mensaje', e.target.value)} placeholder="Experiencia, disponibilidad, etc." />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.mayorDeEdad} onChange={e => setField('mayorDeEdad', e.target.checked)} className="w-5 h-5 accent-trust-blue" />
              <span className="font-body-md">Declaro que soy mayor de 18 años.</span>
            </label>
            {errors.mayorDeEdad && <p className="text-error text-sm mt-1">{errors.mayorDeEdad}</p>}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-trust-blue text-white font-label-bold text-label-bold rounded-full min-h-[48px] px-6 hover:bg-trust-blue-dark transition-colors shadow-level-1 hover:shadow-level-2 disabled:opacity-50"
            >
              <Send size={18} strokeWidth={2.5} />
              {submitting ? 'Enviando…' : 'Enviar postulación'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TrabajaConNosotros;
