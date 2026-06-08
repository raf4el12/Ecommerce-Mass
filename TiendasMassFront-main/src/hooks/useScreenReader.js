// hooks/useScreenReader.js
import { useCallback } from 'react';

export const useScreenReader = () => {
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);

    // Pequeño delay para asegurar que el elemento esté en el DOM
    setTimeout(() => {
      announcement.textContent = message;
    }, 100);

    // Remover el elemento después de que el mensaje sea anunciado
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  const announceError = useCallback((message) => {
    announce(message, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message) => {
    announce(message, 'polite');
  }, [announce]);

  const announceLoading = useCallback((message) => {
    announce(message, 'polite');
  }, [announce]);

  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading
  };
};