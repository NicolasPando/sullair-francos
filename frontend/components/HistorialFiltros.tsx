'use client';

import { EstadoMovimiento, Sector, TipoMovimiento } from '@/lib/types';
import { CronosFiltro } from '@/lib/filtros';
import SectorPills from './SectorPills';

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

const CRONOS: [CronosFiltro, string][] = [
  ['todos', 'Todos'],
  ['pendiente', '✗ Pendiente en Cronos'],
  ['cargado', '✓ Cargado en Cronos'],
];

interface TecnicoOpcion {
  id: string;
  nombre: string;
  sector?: string | null;
  sectorId?: string | null;
}

export default function HistorialFiltros({
  tipo,
  onTipo,
  estado,
  onEstado,
  tecnicoId,
  onTecnico,
  tecnicos,
  sectores,
  sectorId,
  onSector,
  cronos,
  onCronos,
}: {
  tipo: TipoMovimiento | 'todos';
  onTipo: (v: TipoMovimiento | 'todos') => void;
  estado?: EstadoMovimiento | 'todos';
  onEstado?: (v: EstadoMovimiento | 'todos') => void;
  tecnicoId?: string;
  onTecnico?: (v: string) => void;
  tecnicos?: TecnicoOpcion[];
  sectores?: Sector[];
  sectorId?: string;
  onSector?: (v: string) => void;
  cronos?: CronosFiltro;
  onCronos?: (v: CronosFiltro) => void;
}) {
  const conFiltrosAvanzados = estado !== undefined && onEstado && onTecnico;
  // al elegir un sector, el selector de técnicos muestra solo los de ese sector
  const tecnicosVisibles = (tecnicos || []).filter((t) => !sectorId || t.sectorId === sectorId);

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
          {cronos !== undefined && onCronos && (
            <div className="f-pills-row">
              <span className="f-pill-label">Cronos:</span>
              {CRONOS.map(([v, l]) => (
                <button key={v} className={`f-pill ${cronos === v ? 'on' : ''}`} onClick={() => onCronos(v)}>{l}</button>
              ))}
            </div>
          )}
          {sectores && onSector && <SectorPills sectores={sectores} value={sectorId || ''} onChange={onSector} />}
          <div className="f-pills-row">
            <span className="f-pill-label">Técnico:</span>
            <select className="f-tec-sel" value={tecnicoId || ''} onChange={(e) => onTecnico!(e.target.value)}>
              <option value="">Todos</option>
              {tecnicosVisibles.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}{!sectorId && t.sector ? ` — ${t.sector}` : ''}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
