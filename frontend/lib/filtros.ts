import { EstadoMovimiento, Movimiento, TipoMovimiento } from './types';

export type CronosFiltro = 'todos' | 'pendiente' | 'cargado';

// Cronos solo aplica a francos solicitados y guardias pasivas YA aprobados
// (los francos generados y los ajustes no se cargan en Cronos).
export function aplicaCronos(m: Movimiento): boolean {
  return m.estado === 'aprobado' && (m.tipo === 'consumido' || m.tipo === 'guardia');
}

export interface FiltrosMovimientos {
  tipo: TipoMovimiento | 'todos';
  estado: EstadoMovimiento | 'todos';
  tecnicoId: string;
  sectorId: string;
  cronos: CronosFiltro;
}

export const FILTROS_INICIALES: FiltrosMovimientos = {
  tipo: 'todos',
  estado: 'todos',
  tecnicoId: '',
  sectorId: '',
  cronos: 'todos',
};

export function filtrarMovimientos(movs: Movimiento[], f: FiltrosMovimientos): Movimiento[] {
  return movs.filter((m) => {
    if (f.tipo !== 'todos' && m.tipo !== f.tipo) return false;
    if (f.estado !== 'todos' && m.estado !== f.estado) return false;
    if (f.tecnicoId && m.tecnico.id !== f.tecnicoId) return false;
    if (f.sectorId && m.tecnico.sector?.id !== f.sectorId) return false;
    if (f.cronos === 'pendiente' && !(aplicaCronos(m) && !m.cronos)) return false;
    if (f.cronos === 'cargado' && !(aplicaCronos(m) && m.cronos)) return false;
    return true;
  });
}
