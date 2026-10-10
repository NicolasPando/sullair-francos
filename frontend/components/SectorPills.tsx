'use client';

import { Sector } from '@/lib/types';

// Filtro por sector en forma de "pills". No se muestra si hay un solo sector (no tendria sentido filtrar).
export default function SectorPills({
  sectores,
  value,
  onChange,
  conEtiqueta = true,
}: {
  sectores: Sector[];
  value: string;
  onChange: (sectorId: string) => void;
  conEtiqueta?: boolean;
}) {
  if (sectores.length < 2) return null;
  return (
    <div className="f-pills-row">
      {conEtiqueta && <span className="f-pill-label">Sector:</span>}
      <button className={`f-pill ${value === '' ? 'on' : ''}`} onClick={() => onChange('')}>Todos</button>
      {sectores.map((s) => (
        <button key={s.id} className={`f-pill ${value === s.id ? 'on' : ''}`} onClick={() => onChange(s.id)}>{s.nombre}</button>
      ))}
    </div>
  );
}
