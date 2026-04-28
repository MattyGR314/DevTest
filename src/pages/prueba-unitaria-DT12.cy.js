/// <reference types="cypress" />

// Lógica pura unificada basada en DetallesProyecto.js
const validarDetallesDT12 = (fechaLimite, numeroTesters, now = new Date()) => {
  // DT_12_5: Al menos uno debe tener valor
  if (!fechaLimite && !numeroTesters) return false;

  if (fechaLimite) {
    const hoy = new Date(now);
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(`${fechaLimite}T00:00:00`);
    if (fechaSeleccionada <= hoy) return false;
  }

  if (numeroTesters) {
    const valor = String(numeroTesters).trim();
    if (!/^\d+$/.test(valor)) return false;
    const numero = Number.parseInt(valor, 10);
    if (numero <= 0) return false;
  }

  return true;
};

// Funciones auxiliares
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const shiftDays = (baseDate, days) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d;
};

describe('DT_12 - Pruebas unitarias: añadir fecha límite y número de testers al proyecto', () => {
  // Inyección de fecha base para garantizar repetibilidad (característica clave en pruebas unitarias)
  const baseDate = new Date('2026-04-28T10:00:00');

  // ─── Grupo 1: Validación del campo fecha límite ──────────────────────────────
  describe('DT_12_1 - Validación de fecha (con testers vacío)', () => {
    it('Aceptar fecha posterior a hoy (mañana)', () => {
      const manana = formatDate(shiftDays(baseDate, 1));
      expect(validarDetallesDT12(manana, '', baseDate)).to.eq(true);
    });

    it('Rechazar fecha exactamente hoy', () => {
      const hoy = formatDate(baseDate);
      expect(validarDetallesDT12(hoy, '', baseDate)).to.eq(false);
    });

    it('Rechazar fecha anterior a hoy (ayer)', () => {
      const ayer = formatDate(shiftDays(baseDate, -1));
      expect(validarDetallesDT12(ayer, '', baseDate)).to.eq(false);
    });

    it('Aceptar fecha muy futura (+2 años)', () => {
      const futuro = new Date(baseDate);
      futuro.setFullYear(futuro.getFullYear() + 2);
      expect(validarDetallesDT12(formatDate(futuro), '', baseDate)).to.eq(true);
    });
  });

  // ─── Grupo 2: Validación del campo número de testers ───────────────────────
  describe('DT_12_2 - Validación de testers (con fecha vacía)', () => {
    it('Aceptar entero positivo mayor que 0', () => {
      expect(validarDetallesDT12('', '5', baseDate)).to.eq(true);
      expect(validarDetallesDT12('', '100', baseDate)).to.eq(true);
    });

    it('Aceptar número de testers igual a 1 (valor mínimo)', () => {
      expect(validarDetallesDT12('', '1', baseDate)).to.eq(true);
    });

    it('Rechazar número de testers igual a 0', () => {
      expect(validarDetallesDT12('', '0', baseDate)).to.eq(false);
    });

    it('Rechazar número de testers negativo', () => {
      expect(validarDetallesDT12('', '-1', baseDate)).to.eq(false);
    });

    it('Rechazar número de testers decimal', () => {
      expect(validarDetallesDT12('', '2.5', baseDate)).to.eq(false);
    });

    it('Rechazar texto no numérico', () => {
      expect(validarDetallesDT12('', 'abc', baseDate)).to.eq(false);
    });
  });

  // ─── Grupo 3: Comportamiento combinado ─────────────────────────────────────
  describe('DT_12_3 - Comportamiento combinado', () => {
    it('Rechazar cuando ambos campos están vacíos (infringe regla de negocio)', () => {
      expect(validarDetallesDT12('', '', baseDate)).to.eq(false);
      expect(validarDetallesDT12(null, null, baseDate)).to.eq(false);
      expect(validarDetallesDT12(undefined, undefined, baseDate)).to.eq(false);
    });

    it('Aceptar cuando ambos campos tienen valores válidos', () => {
      const manana = formatDate(shiftDays(baseDate, 1));
      expect(validarDetallesDT12(manana, '5', baseDate)).to.eq(true);
    });

    it('Rechazar si la fecha es inválida, aunque los testers sean válidos', () => {
      const hoy = formatDate(baseDate);
      expect(validarDetallesDT12(hoy, '5', baseDate)).to.eq(false);
    });

    it('Rechazar si los testers son inválidos, aunque la fecha sea válida', () => {
      const manana = formatDate(shiftDays(baseDate, 1));
      expect(validarDetallesDT12(manana, '0', baseDate)).to.eq(false);
    });
  });
});