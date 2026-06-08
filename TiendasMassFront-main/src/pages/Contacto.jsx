import React from "react";

const Contacto = () => {
  return (
    <div className="w-full flex flex-col bg-surface-grey font-body-md text-on-surface">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-section-gap w-full space-y-12">
        
        {/* Top Section */}
        <section className="bg-surface rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,51,160,0.08)] flex flex-col md:flex-row items-center gap-12 border border-outline-variant/30">
          <div className="flex-1">
            <h2 className="font-headline-xl text-headline-xl text-trust-blue mb-6">¡HOLA!<br />SOY TU TIENDA MASS</h2>
            <p className="font-body-lg text-on-surface-variant max-w-lg">
              Soy la tienda con los mejores precios y los productos necesarios para tu hogar, siempre cerquita a ti.
            </p>
          </div>
          <div className="w-full md:w-1/2 aspect-video bg-surface-container-high rounded-2xl overflow-hidden shadow-inner border border-outline-variant/20">
            <img className="w-full h-full object-cover" src="https://www.tiendasmass.com.pe/wp-content/themes/mass/img/DSC_34711.webp" alt="Tienda Mass" />
          </div>
        </section>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Valor */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 flex flex-col h-full">
            <div className="h-64 overflow-hidden">
              <img className="w-full h-full object-cover" src="https://www.tiendasmass.com.pe/wp-content/uploads/2023/05/DSC_34341.png" alt="Trabajadora Mass" />
            </div>
            <div className="p-8 flex flex-col gap-4 flex-1 bg-mass-yellow/10">
              <h3 className="font-headline-md text-headline-md text-trust-blue">MI PROPUESTA DE VALOR</h3>
              <p className="font-body-md text-on-surface-variant italic">
                "Soy una tienda con los precios más bajos cerca de ti, y lo consigo gracias a mis surtidos optimizados especializados en marcas propias de calidad que cubren las necesidades diarias de mi caser@."
              </p>
            </div>
          </div>

          {/* Explicacion */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/20 flex flex-col justify-center h-full gap-6">
            <div>
              <h3 className="font-headline-md text-headline-md text-trust-blue mb-2">Soy una tienda de precios bajos</h3>
              <p className="font-label-bold text-on-surface-variant uppercase tracking-wider text-sm">¿Cómo lo logro?</p>
            </div>
            
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-3 font-label-bold text-trust-blue bg-secondary-fixed/50 px-4 py-3 rounded-lg"><span className="material-symbols-outlined">check_circle</span> PROCESOS SIMPLES</li>
              <li className="flex items-center gap-3 font-label-bold text-trust-blue bg-secondary-fixed/50 px-4 py-3 rounded-lg"><span className="material-symbols-outlined">check_circle</span> COSTOS BAJOS</li>
              <li className="flex items-center gap-3 font-label-bold text-trust-blue bg-secondary-fixed/50 px-4 py-3 rounded-lg"><span className="material-symbols-outlined">check_circle</span> PRECIOS BAJOS SIEMPRE</li>
            </ul>
            
            <p className="font-body-md text-on-surface-variant bg-surface-grey p-4 rounded-xl border border-outline-variant/20">
              Manteniendo siempre procesos simples y costos bajos, logro tener los mejores precios todos los días cerca de tu hogar.<br/><br/>
              ¡Pero eso no es todo! También me esfuerzo en mantener los precios en donde para asegurarte que yo tengo los mejores.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contacto;