'use client';

import { Movimiento } from '@/lib/types';

export default function CronosChip({ movimientos }: { movimientos: Movimiento[] }) {
  const aprobados = movimientos.filter((m) => m.estado === 'aprobado');
  if (!aprobados.length) return null;

  const pendientes = aprobados.filter((m) => !m.cronos).length;
  const cargados = aprobados.filter((m) => m.cronos).length;

  return (
    <div>
      {pendientes > 0 && (
        <span className="cronos-chip pend">✗ {pendientes} pendiente{pendientes > 1 ? 's' : ''} en Cronos</span>
      )}
      {cargados > 0 && (
        <span className="cronos-chip ok">✓ {cargados} cargado{cargados > 1 ? 's' : ''} en Cronos</span>
      )}
    </div>
  );
}
