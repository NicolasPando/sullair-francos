export type Rol = 'admin' | 'encargado' | 'tecnico';

export interface SesionUsuario {
  sub: string;
  rol: Rol;
  nombre: string;
  sectorId: string | null;
}

export interface Sector {
  id: string;
  nombre: string;
}

export interface Opciones {
  setupPendiente: boolean;
}

export type TipoMovimiento = 'generado' | 'consumido' | 'guardia' | 'ajuste';
export type EstadoMovimiento = 'pendiente' | 'aprobado' | 'rechazado';
export type Turno = 'man' | 'tar';
export type DiaTrabajado = 'sabado' | 'domingo';

export interface Tecnico {
  id: string;
  nombre: string;
  sector: Sector;
  activo: boolean;
  pinHash: string | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  rol: 'admin' | 'encargado';
  sector: Sector | null;
}

export interface SaldoTecnico {
  tecnicoId: string;
  nombre: string;
  sector: string | null;
  activo: boolean;
  saldo: number;
}

export interface FechaSolicitada {
  fecha: string;
  esMedio: boolean;
  turno: Turno | null;
}

export interface DiaGuardia {
  fecha: string;
  convocado: boolean;
  inicio: string | null;
  fin: string | null;
}

export interface Movimiento {
  id: string;
  tecnico: Tecnico;
  tipo: TipoMovimiento;
  cantidad: number;
  fechaTrabajo: string | null;
  diaTrabajado: DiaTrabajado | null;
  fechaDeseada: string | null;
  turno: Turno | null;
  fechasSolicitadas: FechaSolicitada[] | null;
  guardiaDesde: string | null;
  guardiaHasta: string | null;
  guardiaDias: DiaGuardia[] | null;
  guardiaNovedades: string | null;
  motivoAjuste: string | null;
  estado: EstadoMovimiento;
  resueltoPor: string | null;
  resueltoEn: string | null;
  motivoRechazo: string | null;
  comentario: string | null;
  cronos: boolean;
  creadoEn: string;
}
