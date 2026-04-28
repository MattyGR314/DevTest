/// <reference types="cypress" />

// Funciones de validación extraídas de SubirCodigo.js (lógica pura, sin estado React)
const validarFechaLimite = (fechaLimite, now = new Date()) => {
  if (!fechaLimite) return true;
  const hoy = new Date(now);
  hoy.setHours(0, 0, 0, 0);
  const fechaSeleccionada = new Date(`${fechaLimite}T00:00:00`);
  return fechaSeleccionada > hoy;
};

const validarNumeroTesters = (numeroTesters) => {
  if (numeroTesters === '' || numeroTesters === null || numeroTesters === undefined) return true;
  const valor = String(numeroTesters).trim();
  if (!/^\d+$/.test(valor)) return false;
  const numero = Number.parseInt(valor, 10);
  return numero > 0;
};

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
  const baseDate = new Date('2026-04-28T10:00:00');

  // ─── Grupo 1: Validación de fecha límite ────────────────────────────────────

  describe('DT_12_1 - Validación del campo fecha límite', () => {
    // DT_12_1_1: campo opcional, vacío es válido
    it('DT_12_1_1: Aceptar fecha límite vacía (campo opcional)', () => {
      expect(validarFechaLimite('', baseDate)).to.eq(true);
      expect(validarFechaLimite(null, baseDate)).to.eq(true);
      expect(validarFechaLimite(undefined, baseDate)).to.eq(true);
    });

    // DT_12_1_2: fecha futura (mañana) debe aceptarse
    it('DT_12_1_2: Aceptar fecha posterior a hoy (mañana)', () => {
      const manana = formatDate(shiftDays(baseDate, 1));
      expect(validarFechaLimite(manana, baseDate)).to.eq(true);
    });

    // DT_12_1_3: fecha de hoy debe rechazarse (debe ser estrictamente posterior)
    it('DT_12_1_3: Rechazar fecha exactamente hoy', () => {
      const hoy = formatDate(baseDate);
      expect(validarFechaLimite(hoy, baseDate)).to.eq(false);
    });

    // DT_12_1_4: fecha pasada debe rechazarse
    it('DT_12_1_4: Rechazar fecha anterior a hoy (ayer)', () => {
      const ayer = formatDate(shiftDays(baseDate, -1));
      expect(validarFechaLimite(ayer, baseDate)).to.eq(false);
    });

    // DT_12_1_5: fecha muy lejana en el futuro (+2 años) debe aceptarse
    it('DT_12_1_5: Aceptar fecha muy futura (+2 años)', () => {
      const futuro = new Date(baseDate);
      futuro.setFullYear(futuro.getFullYear() + 2);
      expect(validarFechaLimite(formatDate(futuro), baseDate)).to.eq(true);
    });
  });

  // ─── Grupo 2: Validación del número de testers ──────────────────────────────

  describe('DT_12_2 - Validación del campo número de testers', () => {
    // DT_12_2_1: campo opcional, vacío es válido
    it('DT_12_2_1: Aceptar número de testers vacío (campo opcional)', () => {
      expect(validarNumeroTesters('')).to.eq(true);
      expect(validarNumeroTesters(null)).to.eq(true);
      expect(validarNumeroTesters(undefined)).to.eq(true);
    });

    // DT_12_2_2: entero positivo mayor que 0 es válido
    it('DT_12_2_2: Aceptar entero positivo mayor que 0', () => {
      expect(validarNumeroTesters('5')).to.eq(true);
      expect(validarNumeroTesters('100')).to.eq(true);
    });

    // DT_12_2_3: valor límite mínimo: 1 debe aceptarse
    it('DT_12_2_3: Aceptar número de testers igual a 1 (valor mínimo)', () => {
      expect(validarNumeroTesters('1')).to.eq(true);
    });

    // DT_12_2_4: 0 debe rechazarse (debe ser mayor que 0)
    it('DT_12_2_4: Rechazar número de testers igual a 0', () => {
      expect(validarNumeroTesters('0')).to.eq(false);
    });

    // DT_12_2_5: número negativo debe rechazarse
    it('DT_12_2_5: Rechazar número de testers negativo', () => {
      expect(validarNumeroTesters('-1')).to.eq(false);
      expect(validarNumeroTesters('-10')).to.eq(false);
    });

    // DT_12_2_6: decimal debe rechazarse (solo enteros)
    it('DT_12_2_6: Rechazar número de testers decimal', () => {
      expect(validarNumeroTesters('2.5')).to.eq(false);
      expect(validarNumeroTesters('1.0')).to.eq(false);
    });

    // DT_12_2_7: texto no numérico debe rechazarse
    it('DT_12_2_7: Rechazar texto no numérico como número de testers', () => {
      expect(validarNumeroTesters('abc')).to.eq(false);
      expect(validarNumeroTesters('cinco')).to.eq(false);
    });
  });

  // ─── Grupo 3: Comportamiento combinado de ambos campos ──────────────────────

  describe('DT_12_3 - Comportamiento combinado: fecha límite y número de testers', () => {
    // DT_12_3_1: ambos vacíos es válido (los dos son opcionales)
    it('DT_12_3_1: Aceptar cuando ambos campos están vacíos (son opcionales)', () => {
      expect(validarFechaLimite('', baseDate)).to.eq(true);
      expect(validarNumeroTesters('')).to.eq(true);
    });

    // DT_12_3_2: solo fecha válida, sin testers
    it('DT_12_3_2: Aceptar cuando solo se proporciona fecha futura', () => {
      const manana = formatDate(shiftDays(baseDate, 1));
      expect(validarFechaLimite(manana, baseDate)).to.eq(true);
      expect(validarNumeroTesters('')).to.eq(true);
    });

    // DT_12_3_3: solo testers válido, sin fecha
    it('DT_12_3_3: Aceptar cuando solo se proporciona un número de testers válido', () => {
      expect(validarFechaLimite('', baseDate)).to.eq(true);
      expect(validarNumeroTesters('10')).to.eq(true);
    });

    // DT_12_3_4: ambos campos con datos válidos
    it('DT_12_3_4: Aceptar cuando ambos campos tienen valores válidos', () => {
      const manana = formatDate(shiftDays(baseDate, 1));
      expect(validarFechaLimite(manana, baseDate)).to.eq(true);
      expect(validarNumeroTesters('5')).to.eq(true);
    });

    // DT_12_3_5: fecha inválida con testers válido: la fecha invalida el envío
    it('DT_12_3_5: Rechazar cuando la fecha es hoy aunque el número de testers sea válido', () => {
      const hoy = formatDate(baseDate);
      expect(validarFechaLimite(hoy, baseDate)).to.eq(false);
      expect(validarNumeroTesters('5')).to.eq(true);
    });

    // DT_12_3_6: fecha válida con testers inválido: los testers invalidan el envío
    it('DT_12_3_6: Rechazar cuando el número de testers es 0 aunque la fecha sea válida', () => {
      const manana = formatDate(shiftDays(baseDate, 1));
      expect(validarFechaLimite(manana, baseDate)).to.eq(true);
      expect(validarNumeroTesters('0')).to.eq(false);
    });
  });
});
