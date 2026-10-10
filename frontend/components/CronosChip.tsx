'use client';

import { Movimiento } from '@/lib/types';
import { aplicaCronos } from '@/lib/filtros';

// Resumen de lo que falta / ya esta cargado en Cronos (solo francos solicitados y guardias aprobados)
export default function CronosChip({ movimientos }: { movimientos: Movimiento[] }) {
  const aplicables = movimientos.filter(aplicaCronos);
  if (!aplicables.length) return null;

  const pendientes = aplicables.filter((m) => !m.cronos).length;
  const cargados = aplicables.filter((m) => m.cronos).length;

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
