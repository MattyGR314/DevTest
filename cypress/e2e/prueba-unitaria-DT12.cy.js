/// <reference types="cypress" />

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

const parseIsoDateStrict = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return { ok: false, reason: 'EMPTY' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: false, reason: 'INVALID_FORMAT' };
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  const sameDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  if (!sameDate) return { ok: false, reason: 'INVALID_DATE' };
  return { ok: true, value: trimmed };
};

const validarFeedbackDT12 = ({ fechaLimite, numeroTesters }, now = new Date()) => {
  const fechaRaw = (fechaLimite ?? '').toString();
  const testersRaw = (numeroTesters ?? '').toString();

  const fechaTrim = fechaRaw.trim();
  const testersTrim = testersRaw.trim();

  // DT_12_5
  if (!fechaTrim && !testersTrim) {
    return {
      valido: false,
      error: 'Debes rellenar al menos uno de los campos.',
      codigo: 'BOTH_EMPTY',
    };
  }

  if (fechaTrim) {
    const parsed = parseIsoDateStrict(fechaTrim);
    if (!parsed.ok) {
      return {
        valido: false,
        error: 'La fecha no es valida.',
        codigo: 'DATE_INVALID',
      };
    }

    const hoy = formatDate(now);

    // DT_12_3
    if (parsed.value <= hoy) {
      return {
        valido: false,
        error: 'La fecha debe ser posterior a la fecha actual.',
        codigo: 'DATE_NOT_FUTURE',
      };
    }
  }

  if (testersTrim) {
    // DT_12_4
    if (!/^\d+$/.test(testersTrim)) {
      return {
        valido: false,
        error: 'El numero de testers debe ser un entero positivo mayor que 0.',
        codigo: 'TESTERS_INVALID',
      };
    }

    const parsed = Number(testersTrim);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return {
        valido: false,
        error: 'El numero de testers debe ser un entero positivo mayor que 0.',
        codigo: 'TESTERS_INVALID',
      };
    }
  }

  return {
    valido: true,
    payload: {
      ...(fechaTrim ? { fechaLimite: fechaTrim } : {}),
      ...(testersTrim ? { numeroTesters: Number(testersTrim) } : {}),
    },
  };
};

describe('DT_12 - Pruebas unitarias de validacion de feedback', () => {
  const baseDate = new Date('2026-04-26T10:00:00');

  // DT_12_1_1 Cobertura minima: ambos campos informados
  it('DT_12_1_1: Aceptar fecha futura y testers valido', () => {
    const res = validarFeedbackDT12({
      fechaLimite: formatDate(shiftDays(baseDate, 1)),
      numeroTesters: '5',
    }, baseDate);

    expect(res.valido).to.eq(true);
    expect(res.payload).to.deep.eq({
      fechaLimite: formatDate(shiftDays(baseDate, 1)),
      numeroTesters: 5,
    });
  });

  // DT_12_1_2 Cobertura minima: solo fecha informada
  it('DT_12_1_2: Aceptar cuando solo hay fecha futura', () => {
    const res = validarFeedbackDT12({
      fechaLimite: formatDate(shiftDays(baseDate, 1)),
      numeroTesters: '',
    }, baseDate);

    expect(res.valido).to.eq(true);
    expect(res.payload).to.deep.eq({ fechaLimite: formatDate(shiftDays(baseDate, 1)) });
  });

  // DT_12_1_3 Cobertura minima: solo testers informado
  it('DT_12_1_3: Aceptar cuando solo hay testers valido', () => {
    const res = validarFeedbackDT12({
      fechaLimite: '',
      numeroTesters: '1',
    }, baseDate);

    expect(res.valido).to.eq(true);
    expect(res.payload).to.deep.eq({ numeroTesters: 1 });
  });

  // DT_12_1_4 Cobertura minima: ambos vacios
  it('DT_12_1_4: Rechazar cuando ambos campos estan vacios', () => {
    const res = validarFeedbackDT12({ fechaLimite: '', numeroTesters: '' }, baseDate);

    expect(res.valido).to.eq(false);
    expect(res.codigo).to.eq('BOTH_EMPTY');
  });

  // DT_12_2_1 Validacion de fecha: fecha exactamente hoy
  it('DT_12_2_1: Rechazar fecha exactamente hoy', () => {
    const res = validarFeedbackDT12({
      fechaLimite: formatDate(baseDate),
      numeroTesters: '',
    }, baseDate);

    expect(res.valido).to.eq(false);
    expect(res.codigo).to.eq('DATE_NOT_FUTURE');
  });

  // DT_12_2_2 Validacion de fecha: fecha anterior
  it('DT_12_2_2: Rechazar fecha anterior a hoy', () => {
    const res = validarFeedbackDT12({
      fechaLimite: formatDate(shiftDays(baseDate, -1)),
      numeroTesters: '',
    }, baseDate);

    expect(res.valido).to.eq(false);
    expect(res.codigo).to.eq('DATE_NOT_FUTURE');
  });

  // DT_12_2_3 Validacion de fecha: fecha muy futura
  it('DT_12_2_3: Aceptar fecha muy futura (+2 anos)', () => {
    const veryFuture = new Date(baseDate);
    veryFuture.setFullYear(veryFuture.getFullYear() + 2);

    const res = validarFeedbackDT12({
      fechaLimite: formatDate(veryFuture),
      numeroTesters: '',
    }, baseDate);

    expect(res.valido).to.eq(true);
    expect(res.payload).to.deep.eq({ fechaLimite: formatDate(veryFuture) });
  });

  // DT_12_2_4 Validacion de fecha: formato invalido
  it('DT_12_2_4: Rechazar fecha con formato invalido', () => {
    const res = validarFeedbackDT12({
      fechaLimite: '26/04/2026',
      numeroTesters: '',
    }, baseDate);

    expect(res.valido).to.eq(false);
    expect(res.codigo).to.eq('DATE_INVALID');
  });

  // DT_12_2_5 Validacion de fecha: fecha imposible
  it('DT_12_2_5: Rechazar fecha imposible', () => {
    const res = validarFeedbackDT12({
      fechaLimite: '2026-02-30',
      numeroTesters: '',
    }, baseDate);

    expect(res.valido).to.eq(false);
    expect(res.codigo).to.eq('DATE_INVALID');
  });

  // DT_12_2_6 Validacion de fecha: fecha con espacios normalizable
  it('DT_12_2_6: Aceptar fecha con espacios cuando al parsear es futura', () => {
    const res = validarFeedbackDT12({
      fechaLimite: `  ${formatDate(shiftDays(baseDate, 1))}  `,
      numeroTesters: '',
    }, baseDate);

    expect(res.valido).to.eq(true);
    expect(res.payload).to.deep.eq({ fechaLimite: formatDate(shiftDays(baseDate, 1)) });
  });

  // DT_12_3_1 Validacion de testers: testers = 1 valido
  it('DT_12_3_1: Aceptar testers = 1', () => {
    const res = validarFeedbackDT12({
      fechaLimite: '',
      numeroTesters: '1',
    }, baseDate);

    expect(res.valido).to.eq(true);
    expect(res.payload).to.deep.eq({ numeroTesters: 1 });
  });

  // DT_12_3_2 Validacion de testers: invalidos representativos
  it('DT_12_3_2: Rechazar testers 0, decimal y negativo', () => {
    const invalidos = ['0', '2.5', '-2'];

    invalidos.forEach((numero) => {
      const res = validarFeedbackDT12({
        fechaLimite: '',
        numeroTesters: numero,
      }, baseDate);

      expect(res.valido).to.eq(false);
      expect(res.codigo).to.eq('TESTERS_INVALID');
    });
  });
});