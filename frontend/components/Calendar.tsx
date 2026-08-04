'use client';

import { useMemo, useState } from 'react';
import { Movimiento, TipoMovimiento } from '@/lib/types';

const DS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function rango(d1: string, d2: string): string[] {
  const r: string[] = [];
  let c = new Date(`${d1}T00:00:00`);
  const e = new Date(`${d2}T00:00:00`);
  while (c <= e) {
    r.push(c.toISOString().slice(0, 10));
    c.setDate(c.getDate() + 1);
  }
  return r;
}

// Reproduce movDates() del HTML original: en que fechas "aparece" cada movimiento en el calendario
function fechasDeMovimiento(m: Movimiento): string[] {
  if (m.tipo === 'generado' && m.fechaTrabajo) return [m.fechaTrabajo];
  if (m.tipo === 'consumido') {
    if (m.fechasSolicitadas?.length) return m.fechasSolicitadas.map((f) => f.fecha);
    const f = m.fechaDeseada || m.creadoEn?.slice(0, 10);
    return f ? [f] : [];
  }
  if (m.tipo === 'guardia' && m.guardiaDesde && m.guardiaHasta) return rango(m.guardiaDesde, m.guardiaHasta);
  if (m.tipo === 'ajuste' && m.creadoEn) return [m.creadoEn.slice(0, 10)];
  return [];
}

function pertenece(m: Movimiento, fecha: string): boolean {
  if (m.tipo === 'generado') return m.fechaTrabajo === fecha;
  if (m.tipo === 'consumido') {
    if (m.fechasSolicitadas?.length) return m.fechasSolicitadas.some((f) => f.fecha === fecha);
    return (m.fechaDeseada || m.creadoEn?.slice(0, 10)) === fecha;
  }
  if (m.tipo === 'guardia') return !!(m.guardiaDesde && m.guardiaHasta && m.guardiaDesde <= fecha && fecha <= m.guardiaHasta);
  if (m.tipo === 'ajuste') return m.creadoEn?.slice(0, 10) === fecha;
  return false;
}

const DOT_CLASE: Record<TipoMovimiento, string> = {
  generado: 'd-gen',
  consumido: 'd-con',
  guardia: 'd-gua',
  ajuste: 'd-aj',
};

const FILTROS: { valor: TipoMovimiento | 'todos'; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'generado', label: '↑ Gen' },
  { valor: 'consumido', label: '↓ Tom' },
  { valor: 'guardia', label: 'Guardia' },
  { valor: 'ajuste', label: 'Ajuste' },
];

export default function Calendar({ movimientos }: { movimientos: Movimiento[] }) {
  const hoy = new Date();
  const [y, setY] = useState(hoy.getFullYear());
  const [mo, setMo] = useState(hoy.getMonth());
  const [filtro, setFiltro] = useState<TipoMovimiento | 'todos'>('todos');
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const filtrados = useMemo(
    () => (filtro === 'todos' ? movimientos : movimientos.filter((m) => m.tipo === filtro)),
    [movimientos, filtro],
  );

  const mapaDias = useMemo(() => {
    const mapa: Record<string, Movimiento[]> = {};
    filtrados.forEach((m) => {
      fechasDeMovimiento(m).forEach((f) => {
        if (!mapa[f]) mapa[f] = [];
        if (!mapa[f].find((x) => x.id === m.id)) mapa[f].push(m);
      });
    });
    return mapa;
  }, [filtrados]);

  function navegar(dir: number) {
    let nm = mo + dir;
    let ny = y;
    if (nm < 0) { nm = 11; ny -= 1; }
    if (nm > 11) { nm = 0; ny += 1; }
    setMo(nm);
    setY(ny);
  }

  const primerDia = new Date(y, mo, 1);
  const totalDias = new Date(y, mo + 1, 0).getDate();
  const inicioSemana = primerDia.getDay();
  const hoyStr = new Date().toISOString().slice(0, 10);
  const nombreMes = primerDia.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const celdas: (number | null)[] = [];
  for (let i = 0; i < inicioSemana; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);

  const eventosDelDiaSeleccionado = diaSeleccionado
    ? filtrados.filter((m) => pertenece(m, diaSeleccionado))
    : [];

  return (
    <div>
      <div className="cal-head">
        <button className="cal-nav" onClick={() => navegar(-1)}>‹</button>
        <span>{nombreMes}</span>
        <button className="cal-nav" onClick={() => navegar(1)}>›</button>
      </div>

      <div className="cal-filters">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            className={`cal-fb ${filtro === f.valor ? 'on' : ''}`}
            onClick={() => setFiltro(f.valor)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="cal-grid">
        {DS.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
        {celdas.map((d, i) => {
          if (!d) return <div className="cal-c emp" key={i} />;
          const fecha = `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const eventos = mapaDias[fecha] || [];
          const esHoy = fecha === hoyStr;
          const hayPendiente = eventos.some((e) => e.estado === 'pendiente');
          const tipos = [...new Set(eventos.map((e) => e.tipo))];
          return (
            <div
              key={fecha}
              className={`cal-c ${esHoy ? 'tod' : ''} ${eventos.length ? 'hev' : ''}`}
              onClick={() => eventos.length && setDiaSeleccionado(fecha)}
            >
              <span className="cd">{d}{hayPendiente && <span className="cdot" />}</span>
              {tipos.length > 0 && (
                <div className="dots">
                  {tipos.map((t) => <span key={t} className={`dot ${DOT_CLASE[t]}`} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="cal-leg">
        <span className="cal-leg-i"><span className="dot d-gen" />Franco gen.</span>
        <span className="cal-leg-i"><span className="dot d-con" />Franco tom.</span>
        <span className="cal-leg-i"><span className="dot d-gua" />Guardia</span>
        <span className="cal-leg-i"><span className="dot d-aj" />Ajuste</span>
        <span style={{ fontSize: 10, marginLeft: 4 }}>· punto naranja = pendiente</span>
      </div>

      {diaSeleccionado && (
        <DiaModal
          fecha={diaSeleccionado}
          eventos={eventosDelDiaSeleccionado}
          onClose={() => setDiaSeleccionado(null)}
        />
      )}
    </div>
  );
}

function fmt(d: string) {
  const dt = new Date(`${d}T00:00:00`);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const TITULOS: Record<TipoMovimiento, string> = {
  generado: 'Franco generado',
  consumido: 'Franco solicitado',
  guardia: 'Guardia pasiva',
  ajuste: 'Ajuste de saldo',
};

function DiaModal({ fecha, eventos, onClose }: { fecha: string; eventos: Movimiento[]; onClose: () => void }) {
  return (
    <div className="ov" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="mcr">
          <h3>{fmt(fecha)}</h3>
          <button className="mcls" onClick={onClose}>&#215;</button>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {eventos.map((m) => (
            <div className="mv" key={m.id}>
              <div className="mv-top">
                <div className="mv-tipo">{TITULOS[m.tipo]}</div>
                <span className={`badge ${m.estado === 'pendiente' ? 'bp' : m.estado === 'aprobado' ? 'ba' : 'br'}`}>{m.estado}</span>
              </div>
              <div className="mv-tec">{m.tecnico.nombre} · {m.tecnico.sector?.nombre}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
