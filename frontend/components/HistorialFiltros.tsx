'use client';

import { EstadoMovimiento, TipoMovimiento } from '@/lib/types';

const TIPOS: [TipoMovimiento | 'todos', string][] = [
  ['todos', 'Todos'],
  ['generado', '↑ Gen.'],
  ['consumido', '↓ Tom.'],
  ['guardia', 'Guardia'],
  ['ajuste', 'Ajuste'],
];

const ESTADOS: [EstadoMovimiento | 'todos', string][] = [
  ['todos', 'Todos'],
  ['pendiente', 'Pendiente'],
  ['aprobado', 'Aprobado'],
  ['rechazado', 'Rechazado'],
];

interface TecnicoOpcion {
  id: string;
  nombre: string;
  sector?: string | null;
}

export default function HistorialFiltros({
  tipo,
  onTipo,
  estado,
  onEstado,
  tecnicoId,
  onTecnico,
  tecnicos,
}: {
  tipo: TipoMovimiento | 'todos';
  onTipo: (v: TipoMovimiento | 'todos') => void;
  estado?: EstadoMovimiento | 'todos';
  onEstado?: (v: EstadoMovimiento | 'todos') => void;
  tecnicoId?: string;
  onTecnico?: (v: string) => void;
  tecnicos?: TecnicoOpcion[];
}) {
  const conFiltrosAvanzados = estado !== undefined && onEstado && onTecnico;

  return (
    <div className="hist-filters">
      <div className="f-pills-row">
        <span className="f-pill-label">Tipo:</span>
        {TIPOS.map(([v, l]) => (
          <button key={v} className={`f-pill ${tipo === v ? 'on' : ''}`} onClick={() => onTipo(v)}>{l}</button>
        ))}
      </div>
      {conFiltrosAvanzados && (
        <>
          <div className="f-pills-row">
            <span className="f-pill-label">Estado:</span>
            {ESTADOS.map(([v, l]) => (
              <button key={v} className={`f-pill ${estado === v ? 'on' : ''}`} onClick={() => onEstado!(v)}>{l}</button>
            ))}
          </div>
          <div className="f-pills-row">
            <span className="f-pill-label">Técnico:</span>
            <select className="f-tec-sel" value={tecnicoId || ''} onChange={(e) => onTecnico!(e.target.value)}>
              <option value="">Todos</option>
              {(tecnicos || []).map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}{t.sector ? ` — ${t.sector}` : ''}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
