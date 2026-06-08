/**
 * Configuración Global de Vitest para Testing
 * 
 * Este archivo configura el entorno de pruebas para todo el proyecto.
 * Se ejecuta automáticamente antes de cada suite de pruebas.
 * 
 * @module tests/setup/vitest.setup
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

/**
 * Extiende las funciones expect de Vitest con matchers personalizados de jest-dom
 * Esto permite usar matchers como: toBeInTheDocument, toHaveClass, etc.
 */
expect.extend(matchers);

/**
 * Limpieza automática después de cada prueba
 * Elimina todos los componentes React montados del DOM después de cada test
 * Previene efectos secundarios entre pruebas
 */
afterEach(() => {
  cleanup();
});

/**
 * Mock de window.matchMedia para componentes React que lo requieren
 * Algunos componentes de UI necesitan esta API del navegador
 * 
 * @param {string} query - Media query CSS
 * @returns {Object} Objeto mock con propiedades de MediaQueryList
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated pero necesario para compatibilidad
    removeListener: () => {}, // Deprecated pero necesario para compatibilidad
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
