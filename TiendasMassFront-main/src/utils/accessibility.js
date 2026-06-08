// utils/accessibility.js

// Constantes de accesibilidad
export const ARIA_LIVE_PRIORITIES = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive'
};

export const ROLES = {
  ALERT: 'alert',
  STATUS: 'status',
  DIALOG: 'dialog',
  BUTTON: 'button',
  LINK: 'link',
  LISTBOX: 'listbox',
  OPTION: 'option',
  TABLIST: 'tablist',
  TAB: 'tab',
  SEARCH: 'search'
};

// Funciones de utilidad para accesibilidad
export const announceToScreenReader = (message, priority = ARIA_LIVE_PRIORITIES.POLITE) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('role', priority === ARIA_LIVE_PRIORITIES.ASSERTIVE ? ROLES.ALERT : ROLES.STATUS);
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';

  document.body.appendChild(announcement);

  setTimeout(() => {
    announcement.textContent = message;
  }, 100);

  setTimeout(() => {
    if (announcement.parentNode) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

export const generateUniqueId = (prefix = 'a11y') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Configuración de colores para alto contraste
export const HIGH_CONTRAST_COLORS = {
  text: '#000000',
  background: '#FFFFFF',
  link: '#0000FF',
  focus: '#FFFF00',
  error: '#FF0000'
};

// Configuración de tamaños de fuente accesibles
export const ACCESSIBLE_FONT_SIZES = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px'
};