// hooks/useKeyboardNavigation.js
import { useEffect, useRef } from 'react';

export const useKeyboardNavigation = (items, onSelect, isOpen) => {
  const listRef = useRef(null);
  const focusedIndexRef = useRef(-1);

  useEffect(() => {
    if (!isOpen) {
      focusedIndexRef.current = -1;
      return;
    }

    const handleKeyDown = (e) => {
      if (!items || items.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          focusedIndexRef.current = Math.min(
            focusedIndexRef.current + 1,
            items.length - 1
          );
          updateFocus();
          break;

        case 'ArrowUp':
          e.preventDefault();
          focusedIndexRef.current = Math.max(focusedIndexRef.current - 1, 0);
          updateFocus();
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndexRef.current >= 0 && focusedIndexRef.current < items.length) {
            onSelect(items[focusedIndexRef.current]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onSelect(null); // Close without selection
          break;
      }
    };

    const updateFocus = () => {
      if (listRef.current) {
        const items = listRef.current.querySelectorAll('[role="option"]');
        items.forEach((item, index) => {
          if (index === focusedIndexRef.current) {
            item.setAttribute('aria-selected', 'true');
            item.focus();
          } else {
            item.setAttribute('aria-selected', 'false');
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, onSelect, isOpen]);

  return listRef;
};