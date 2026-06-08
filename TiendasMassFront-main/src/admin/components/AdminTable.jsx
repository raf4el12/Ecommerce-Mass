// Tabla CRUD reutilizable para admin. Reemplaza tablas + controles + paginación
// con un único componente parametrizable. Diseñado contra la referencia Stitch
// "Inventory".
//
// Ejemplo mínimo:
//
//   <AdminTable
//     columns={[
//       { key: 'nombre', header: 'Nombre', render: (r) => (
//         <ProductCell name={r.nombre} image={r.imagen} />
//       )},
//       { key: 'categoria', header: 'Categoría' },
//       { key: 'stock', header: 'Stock', render: (r) => (
//         <StatusDot color={r.stock < 20 ? 'sale-red' : 'trust-blue'}>{r.stock}</StatusDot>
//       )},
//       { key: '_actions', header: '', align: 'right', render: (r) => (
//         <RowActions>
//           <RowAction icon={Edit} label="Editar" onClick={() => edit(r)} />
//           <RowAction icon={Trash2} label="Eliminar" variant="danger" onClick={() => del(r)} />
//         </RowActions>
//       )},
//     ]}
//     data={filtered}
//     loading={loading}
//     search={{ value: q, onChange: setQ, placeholder: 'Buscar producto...' }}
//     primaryAction={{ label: 'Nuevo Producto', onClick: openModal }}
//     pagination={{ page, totalItems, pageSize, onPageChange, itemsLabel: 'productos' }}
//   />

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';
import Button from '../../components/ui/Button';

export function AdminTable({
  columns,
  data,
  loading = false,
  empty = 'Sin resultados',
  search,
  filter,
  extraFilters,
  primaryAction,
  exportAction,
  pagination,
  clientPagination = true,
  defaultPageSize = 10,
  getRowKey = (row, i) => row?.id ?? row?._id ?? i,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // If using client-side pagination and no external pagination is provided
  const useClientPagination = clientPagination && !pagination && data && data.length > 0;

  const currentData = useMemo(() => {
    if (!useClientPagination) return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize, useClientPagination]);

  const totalItems = data?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 if data length changes drastically (e.g. search filter applied)
  useEffect(() => {
    if (useClientPagination && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalItems, totalPages, currentPage, useClientPagination]);

  const internalPagination = useClientPagination ? {
    page: currentPage,
    totalItems,
    totalPages,
    pageSize,
    onPageChange: setCurrentPage,
    onPageSizeChange: setPageSize,
    itemsLabel: 'registros'
  } : null;

  const activePagination = pagination || internalPagination;

  const hasControls = search || filter || extraFilters || primaryAction || exportAction;

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full space-y-6">
      {hasControls && (
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          {search ? (
            <div className="relative w-full md:w-96">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              />
              <input
                type="text"
                placeholder={search.placeholder || 'Buscar...'}
                value={search.value ?? ''}
                onChange={(e) => search.onChange?.(e.target.value)}
                className="w-full bg-surface-grey border-2 border-transparent focus:border-trust-blue rounded-lg py-2 min-h-[44px] pl-10 pr-4 font-body-md text-body-md text-on-background outline-none transition-colors shadow-sm"
              />
            </div>
          ) : (
            <div />
          )}
          {extraFilters && (
            <div className="flex flex-1 gap-3 w-full md:w-auto">
              {extraFilters}
            </div>
          )}
          <div className="flex gap-3 w-full md:w-auto">
            {filter && (
              <Button
                variant="outline"
                className="flex-1 md:flex-none w-full min-h-[44px]"
                onClick={filter.onClick}
                leadingIcon={<Filter size={18} />}
              >
                {filter.label || 'Filtrar'}
                {filter.count > 0 && (
                  <span className="bg-trust-blue text-on-primary rounded-full px-2 text-xs font-bold ml-2">
                    {filter.count}
                  </span>
                )}
              </Button>
            )}
            {exportAction && (
              <Button
                variant="outline"
                className="flex-1 md:flex-none w-full min-h-[44px]"
                onClick={exportAction.onClick}
                leadingIcon={exportAction.icon ? <exportAction.icon size={18} /> : null}
              >
                {exportAction.label || 'Exportar'}
              </Button>
            )}
            {primaryAction && (
              <Button
                variant="primary"
                className="flex-1 md:flex-none w-full min-h-[44px]"
                onClick={primaryAction.onClick}
                leadingIcon={primaryAction.icon ? <primaryAction.icon size={18} /> : <Plus size={18} />}
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        </section>
      )}

      <section className="bg-surface rounded-xl shadow-sm border border-surface-container-highest overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-surface-container-highest">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : ''
                    } ${col.headerClassName || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest font-body-md text-body-md">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    Cargando…
                  </td>
                </tr>
              ) : !currentData || currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    {empty}
                  </td>
                </tr>
              ) : (
                currentData.map((row, i) => (
                  <tr
                    key={getRowKey(row, i)}
                    className="hover:bg-surface-container-low transition-colors group"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-4 px-6 align-middle ${
                          col.align === 'right' ? 'text-right' : ''
                        } ${col.cellClassName || ''}`}
                      >
                        {col.render ? col.render(row, i) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {activePagination && (
          <Pagination {...activePagination} />
        )}
      </section>
    </div>
  );
}

function Pagination({
  page = 1,
  totalItems,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemsLabel = 'resultados',
}) {
  const computedTotalPages =
    totalPages ??
    (totalItems != null && pageSize ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1);

  const rangeLabel =
    totalItems != null && pageSize
      ? `Mostrando ${Math.min(
          (page - 1) * pageSize + 1,
          totalItems
        )} a ${Math.min(page * pageSize, totalItems)} de ${totalItems} ${itemsLabel}`
      : `Página ${page} de ${computedTotalPages}`;

  return (
    <div className="bg-surface-container-low px-6 py-4 border-t border-surface-container-highest flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4 text-on-surface-variant font-body-md">
        <span>{rangeLabel}</span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-surface border border-outline-variant rounded px-2 py-1 outline-none focus:border-trust-blue text-sm transition-colors cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          disabled={page >= computedTotalPages}
          onClick={() => onPageChange?.(page + 1)}
          className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export function ProductCell({ name, image, subtitle, fallbackIcon: Fallback = ImageIcon }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded bg-surface-container-highest overflow-hidden flex-shrink-0 flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Fallback size={18} className="text-on-surface-variant" />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-on-surface truncate">{name}</p>
        {subtitle && (
          <p className="text-sm text-on-surface-variant truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

const STATUS_DOT_COLORS = {
  'trust-blue': 'bg-trust-blue',
  'sale-red': 'bg-sale-red',
  'mass-yellow': 'bg-mass-yellow',
  success: 'bg-trust-blue',
  warning: 'bg-mass-yellow',
  danger: 'bg-sale-red',
};

export function StatusDot({ color = 'trust-blue', children, emphasize = false }) {
  const dotClass = STATUS_DOT_COLORS[color] || 'bg-trust-blue';
  const isDanger = color === 'sale-red' || color === 'danger';
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${dotClass} flex-shrink-0`} />
      <span className={isDanger || emphasize ? 'font-bold text-sale-red' : ''}>
        {children}
      </span>
    </div>
  );
}

export function StatusBadge({
  active,
  activeLabel = 'Activo',
  inactiveLabel = 'Inactivo',
}) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 bg-secondary-container/60 text-on-secondary-container font-label-bold text-label-bold px-3 py-1 rounded-full">
      <span className="w-2 h-2 rounded-full bg-trust-blue" />
      {activeLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 bg-error-container text-on-error-container font-label-bold text-label-bold px-3 py-1 rounded-full">
      <span className="w-2 h-2 rounded-full bg-sale-red" />
      {inactiveLabel}
    </span>
  );
}

export function RowActions({ children }) {
  return (
    <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
      {children}
    </div>
  );
}

const ROW_ACTION_VARIANTS = {
  default:
    'text-on-surface-variant hover:text-trust-blue hover:bg-surface-container-highest',
  danger: 'text-on-surface-variant hover:text-error hover:bg-error-container',
  primary: 'text-trust-blue hover:bg-secondary-container/60',
};

export function RowAction({
  icon: Icon,
  onClick,
  variant = 'default',
  label,
  title,
  disabled = false,
}) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      aria-label={label}
      disabled={disabled}
      className={`p-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        ROW_ACTION_VARIANTS[variant] || ROW_ACTION_VARIANTS.default
      }`}
    >
      <Icon size={18} />
    </button>
  );
}

export default AdminTable;
