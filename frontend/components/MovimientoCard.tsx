'use client';

import { useState } from 'react';
import { Movimiento } from '@/lib/types';
import { ReactNode } from 'react';
import Ticket from './Ticket';

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
  onToggleCronos,
  acciones,
}: {
  movimiento: Movimiento;
  mostrarTecnico?: boolean;
  onToggleCronos?: (id: string) => void;
  acciones?: ReactNode;
}) {
  const m = movimiento;
  const [verTicket, setVerTicket] = useState(false);
  const esGuardia = m.tipo === 'guardia';
  const signo = m.tipo === 'consumido' ? '-' : '+';
  const convocados = (m.guardiaDias || []).filter((d) => d.convocado).length;
  const mostrarBotonCronos = onToggleCronos && m.estado === 'aprobado';

  return (
    <div className="mv">
      <div className="mv-top">
        <div>
          <div className="mv-tipo">{TITULOS[m.tipo]}{esGuardia && <span className="badge bg" style={{ marginLeft: 6 }}>Guardia</span>}</div>
          {mostrarTecnico && <div className="mv-tec">{m.tecnico.nombre} · {m.tecnico.sector?.nombre}</div>}
        </div>
        {!esGuardia && <div className="mv-cant">{signo}{fc(m.cantidad)}</div>}
      </div>

      <div className="mv-meta">
        {m.tipo === 'generado' && (
          <>Trabajó el {m.diaTrabajado === 'sabado' ? 'sábado' : 'domingo'} {fmt(m.fechaTrabajo)}</>
        )}
        {m.tipo === 'consumido' && m.fechasSolicitadas?.length ? (
          <>{m.fechasSolicitadas.length > 1 ? 'Días: ' : 'Fecha deseada: '}
            {m.fechasSolicitadas.map((f) => `${fmt(f.fecha)}${f.esMedio ? ` (medio — ${f.turno === 'man' ? 'mañana' : 'tarde'})` : ''}`).join(', ')}
          </>
        ) : m.tipo === 'consumido' && (
          <>Fecha deseada: {fmt(m.fechaDeseada)}</>
        )}
        {esGuardia && (
          <>Período: {m.guardiaDesde === m.guardiaHasta ? fmt(m.guardiaDesde) : `${fmt(m.guardiaDesde)} al ${fmt(m.guardiaHasta)}`} · {convocados} día(s) convocado</>
        )}
        {m.tipo === 'ajuste' && <>{m.motivoAjuste}</>}
        {m.comentario && <div>Comentario: {m.comentario}</div>}
        {m.estado === 'rechazado' && m.motivoRechazo && <div>Motivo de rechazo: {m.motivoRechazo}</div>}
        {m.resueltoPor && <div>Resuelto por {m.resueltoPor}</div>}
      </div>

      <div className="mv-acts">
        <span className={`badge ${BADGE_ESTADO[m.estado]}`}>{m.estado}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setVerTicket(true)}>Ver comprobante</button>
        {mostrarBotonCronos && (
          <button
            className={`btn btn-sm ${m.cronos ? 'btn-cronos-ok' : 'btn-cronos-no'}`}
            onClick={() => onToggleCronos!(m.id)}
          >
            {m.cronos ? '✓' : '✗'} Cronos
          </button>
        )}
        {acciones}
      </div>

      {verTicket && <Ticket movimiento={m} onClose={() => setVerTicket(false)} />}
    </div>
  );
}
