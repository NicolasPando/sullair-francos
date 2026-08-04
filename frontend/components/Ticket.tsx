'use client';

import { Movimiento } from '@/lib/types';

function fmt(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(`${d}T00:00:00`);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtH(iso?: string | null) {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return '—';
  return `${dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}
function fc(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
}

const DS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const ESTADO_CLASE: Record<string, string> = { pendiente: 'tp', aprobado: 'ta', rechazado: 'tr' };
const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente de aprobación',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};
const TITULOS: Record<string, string> = {
  generado: 'Franco generado',
  consumido: 'Solicitud de franco',
  guardia: 'Guardia pasiva',
  ajuste: 'Ajuste de saldo',
};

export default function Ticket({ movimiento, onClose }: { movimiento: Movimiento; onClose: () => void }) {
  const m = movimiento;
  const sc = ESTADO_CLASE[m.estado];
  const sl = ESTADO_LABEL[m.estado];

  return (
    <div className="ov" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="mcls" onClick={onClose} style={{ float: 'right' }}>&#215;</button>
        <div className="ticket" style={{ margin: '4px -2px 0' }}>
        <div className={`tk-stamp ${sc}`}>{sl}</div>
        <div className="tk-body">
          <div className="tk-row"><span>Comprobante</span><b>{m.id.slice(0, 8).toUpperCase()}</b></div>
          <div className="tk-row"><span>Tipo</span><b>{TITULOS[m.tipo]}</b></div>
          <div className="tk-row"><span>Técnico</span><b>{m.tecnico.nombre}</b></div>
          <div className="tk-row"><span>Sector</span><b>{m.tecnico.sector?.nombre}</b></div>

          {m.tipo !== 'guardia' && (
            <div className="tk-row">
              <span>Cantidad</span>
              <b>{m.tipo === 'consumido' ? '-' : '+'}{fc(Math.abs(m.cantidad))}</b>
            </div>
          )}

          {m.tipo === 'generado' && (
            <div className="tk-row">
              <span>Día trabajado</span>
              <b>{m.diaTrabajado === 'sabado' ? 'Sábado' : 'Domingo'} {fmt(m.fechaTrabajo)}</b>
            </div>
          )}

          {m.tipo === 'consumido' && m.fechasSolicitadas?.length ? (
            m.fechasSolicitadas.map((f) => (
              <div className="tk-row" key={f.fecha}>
                <span>Fecha</span>
                <b>{fmt(f.fecha)}{f.esMedio ? ` (medio — ${f.turno === 'man' ? 'mañana' : 'tarde'})` : ''}</b>
              </div>
            ))
          ) : m.tipo === 'consumido' && m.fechaDeseada ? (
            <div className="tk-row"><span>Fecha deseada</span><b>{fmt(m.fechaDeseada)}</b></div>
          ) : null}

          {m.tipo === 'guardia' && (
            <>
              <div className="tk-row">
                <span>Período</span>
                <b>{m.guardiaDesde === m.guardiaHasta ? fmt(m.guardiaDesde) : `${fmt(m.guardiaDesde)} al ${fmt(m.guardiaHasta)}`}</b>
              </div>
              {(m.guardiaDias || []).filter((d) => d.convocado).length === 0 ? (
                <div className="tk-row"><span>Convocatorias</span><b>Ninguna</b></div>
              ) : (
                (m.guardiaDias || []).filter((d) => d.convocado).map((d) => (
                  <div className="tk-row" key={d.fecha}>
                    <span>{DS[new Date(`${d.fecha}T00:00:00`).getDay()]} {fmt(d.fecha)}</span>
                    <b>{d.inicio} — {d.fin}</b>
                  </div>
                ))
              )}
              {m.guardiaNovedades && (
                <div className="tk-row col"><span>Novedades</span><b style={{ lineHeight: 1.5 }}>{m.guardiaNovedades}</b></div>
              )}
            </>
          )}

          {m.comentario && <div className="tk-row col"><span>Comentario</span><b>{m.comentario}</b></div>}
          {m.motivoAjuste && <div className="tk-row col"><span>Motivo</span><b>{m.motivoAjuste}</b></div>}
          {m.motivoRechazo && <div className="tk-row col"><span>Motivo rechazo</span><b>{m.motivoRechazo}</b></div>}
        </div>
        <div className="tk-div" />
        <div className="tk-sign">
          <div><span className="who">{m.tipo === 'guardia' ? 'Registrado por:' : 'Solicitado por:'}</span> {m.tecnico.nombre} — {fmtH(m.creadoEn)}</div>
          <div style={{ marginTop: 3 }}>
            <span className="who">{m.estado === 'pendiente' ? 'Esperando firma de:' : 'Resuelto por:'}</span>{' '}
            {m.resueltoPor ? `${m.resueltoPor} — ${fmtH(m.resueltoEn)}` : 'encargado / administración'}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
