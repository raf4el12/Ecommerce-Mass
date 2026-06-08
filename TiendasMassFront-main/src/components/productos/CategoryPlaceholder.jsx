import React from 'react';
import { Milk, Beef, Wheat, CupSoda, SprayCan, Cookie, Apple, Package } from 'lucide-react';

// Ícono representativo por categoría (placeholder cuando el producto no tiene foto).
const CATEGORY_ICONS = {
  lacteos: Milk,
  lácteos: Milk,
  embutidos: Beef,
  carnes: Beef,
  abarrotes: Wheat,
  bebidas: CupSoda,
  limpieza: SprayCan,
  snacks: Cookie,
  golosinas: Cookie,
  frutas: Apple,
  verduras: Apple,
};

const CategoryPlaceholder = ({ categoria, iconSize = 72, className = '' }) => {
  const key = (categoria || '').trim().toLowerCase();
  const Icon = CATEGORY_ICONS[key] || Package;

  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-trust-blue/35 select-none ${className}`} aria-hidden="true">
      <Icon size={iconSize} strokeWidth={1.5} />
      {categoria && (
        <span className="font-label-bold text-label-bold uppercase tracking-wide text-on-surface-variant/60">
          {categoria}
        </span>
      )}
    </div>
  );
};

export default CategoryPlaceholder;
