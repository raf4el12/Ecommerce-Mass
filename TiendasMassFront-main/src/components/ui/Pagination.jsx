import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-10 mb-4" aria-label="Navegación de páginas">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full border border-surface-container-highest bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest focus:ring-2 focus:ring-trust-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Página anterior"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-1 sm:gap-2">
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="w-8 h-10 flex items-center justify-center text-on-surface-variant">
              <MoreHorizontal size={20} />
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[40px] h-10 px-2 rounded-full flex items-center justify-center font-label-lg transition-colors focus:ring-2 focus:ring-trust-blue focus:outline-none ${
                currentPage === page
                  ? 'bg-trust-blue text-white font-bold shadow-md'
                  : 'bg-surface-container-lowest text-on-surface border border-transparent hover:border-surface-container-highest hover:bg-surface-container-highest'
              }`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full border border-surface-container-highest bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest focus:ring-2 focus:ring-trust-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Página siguiente"
      >
        <ChevronRight size={20} />
      </button>
    </nav>
  );
};

export default Pagination;
