import React from 'react';

const LegalPage = ({ title, lastUpdated, intro, sections = [] }) => (
  <div className="w-full flex flex-col bg-surface-grey font-body-md text-on-surface min-h-screen">
    <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-section-gap w-full">
      <article className="bg-surface-container-lowest rounded-2xl p-6 md:p-10 shadow-level-1">
        <h1 className="font-headline-lg text-headline-lg text-trust-blue mb-2">{title}</h1>
        {lastUpdated && (
          <p className="font-body-md text-on-surface-variant mb-6">Última actualización: {lastUpdated}</p>
        )}

        {/* Aviso: plantilla a validar legalmente */}
        <div className="bg-mass-yellow/15 border-l-4 border-mass-yellow rounded-lg p-4 mb-8">
          <p className="font-body-md text-on-surface">
            <strong>Nota:</strong> Este es un texto de referencia. Debe ser revisado y aprobado por el área legal antes de publicarse.
          </p>
        </div>

        {intro && <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">{intro}</p>}

        <div className="flex flex-col gap-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">{i + 1}. {s.title}</h2>
              {s.paragraphs.map((p, j) => (
                <p key={j} className="font-body-md text-on-surface-variant mb-3 leading-relaxed">{p}</p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </main>
  </div>
);

export default LegalPage;
