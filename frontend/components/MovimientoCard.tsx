'use client';

import { Movimiento } from '@/lib/types';
import { ReactNode } from 'react';

const TITULOS: Record<string, string> = {
  generado: 'Franco generado',
  consumido: 'Franco solicitado',
  guardia: 'Guardia pasiva',
  ajuste: 'Ajuste',
};

const BADGE_ESTADO: Record<string, string> = {
  pendiente: 'bp',
  aprobado: 'ba',
  rechazado: 'br',
};

function fmt(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fc(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
}

export default function MovimientoCard({
  movimiento,
  mostrarTecnico = false,
  acciones,
}: {
  movimiento: Movimiento;
  mostrarTecnico?: boolean;
  acciones?: ReactNode;
}) {
  const m = movimiento;
  const signo = m.tipo === 'consumido' ? '-' : '+';

  return (
    <div className="mv">
      <div className="mv-top">
        <div>
          <div className="mv-tipo">{TITULOS[m.tipo]}</div>
          {mostrarTecnico && <div className="mv-tec">{m.tecnico.nombre} · {m.tecnico.sector?.nombre}</div>}
        </div>
        <div className="mv-cant">{signo}{fc(m.cantidad)}</div>
      </div>

      <div className="mv-meta">
        {m.tipo === 'generado' && <>Trabajado el {fmt(m.fechaTrabajo)} {m.diaTrabajado ? `(${m.diaTrabajado})` : ''}</>}
        {m.tipo === 'consumido' && <>Fecha deseada: {fmt(m.fechaDeseada)} {m.turno ? `· Turno ${m.turno}` : ''}</>}
        {m.tipo === 'guardia' && <>Del {fmt(m.guardiaDesde)} al {fmt(m.guardiaHasta)}{m.guardiaNovedades ? ` · ${m.guardiaNovedades}` : ''}</>}
        {m.tipo === 'ajuste' && <>{m.motivoAjuste}</>}
        {m.comentario && <div>Comentario: {m.comentario}</div>}
        {m.estado === 'rechazado' && m.motivoRechazo && <div>Motivo de rechazo: {m.motivoRechazo}</div>}
        {m.resueltoPor && <div>Resuelto por {m.resueltoPor}</div>}
      </div>

      <div className="mv-acts">
        <span className={`badge ${BADGE_ESTADO[m.estado]}`}>{m.estado}</span>
        {acciones}
      </div>
    </div>
  );
}
