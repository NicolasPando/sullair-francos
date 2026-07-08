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

export interface OpcionTecnico {
  id: string;
  nombre: string;
  sector: string;
  requierePin: boolean;
}

export interface OpcionUsuario {
  id: string;
  nombre: string;
  sector?: string;
}

export interface Opciones {
  setupPendiente: boolean;
}

export type TipoMovimiento = 'generado' | 'consumido' | 'guardia' | 'ajuste';
export type EstadoMovimiento = 'pendiente' | 'aprobado' | 'rechazado';

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

export interface Movimiento {
  id: string;
  tecnico: Tecnico;
  tipo: TipoMovimiento;
  cantidad: number;
  fechaTrabajo: string | null;
  diaTrabajado: string | null;
  fechaDeseada: string | null;
  turno: string | null;
  guardiaDesde: string | null;
  guardiaHasta: string | null;
  guardiaNovedades: string | null;
  motivoAjuste: string | null;
  estado: EstadoMovimiento;
  resueltoPor: string | null;
  resueltoEn: string | null;
  motivoRechazo: string | null;
  comentario: string | null;
  creadoEn: string;
}
