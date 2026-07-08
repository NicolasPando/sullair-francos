import { obtenerToken } from './session';
import {
  Movimiento,
  Opciones,
  Sector,
  Tecnico,
  Usuario,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiError extends Error {}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = obtenerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let mensaje = `Error ${res.status}`;
    try {
      const body = await res.json();
      mensaje = Array.isArray(body.message) ? body.message.join(', ') : body.message || mensaje;
    } catch {
      /* respuesta sin body json */
    }
    throw new ApiError(mensaje);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  opciones: () => apiFetch<Opciones>('/auth/opciones'),
  setup: (nombre: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ nombre, password }),
    }),
  loginTecnico: (tecnicoId: string, pin?: string) =>
    apiFetch<{ token: string; user: any }>('/auth/login/tecnico', {
      method: 'POST',
      body: JSON.stringify({ tecnicoId, pin }),
    }),
  loginUsuario: (usuarioId: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/auth/login/usuario', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, password }),
    }),
};

export const sectoresApi = {
  listar: () => apiFetch<Sector[]>('/sectores'),
  crear: (nombre: string) => apiFetch<Sector>('/sectores', { method: 'POST', body: JSON.stringify({ nombre }) }),
  eliminar: (id: string) => apiFetch(`/sectores/${id}`, { method: 'DELETE' }),
};

export const tecnicosApi = {
  listar: () => apiFetch<Tecnico[]>('/tecnicos'),
  crear: (data: { nombre: string; sectorId: string; pin?: string }) =>
    apiFetch<Tecnico>('/tecnicos', { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id: string, data: Partial<{ nombre: string; sectorId: string; pin: string }>) =>
    apiFetch<Tecnico>(`/tecnicos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleActivo: (id: string) => apiFetch<Tecnico>(`/tecnicos/${id}/toggle-activo`, { method: 'PATCH' }),
};

export const usuariosApi = {
  listar: (rol?: 'admin' | 'encargado') => apiFetch<Usuario[]>(`/usuarios${rol ? `?rol=${rol}` : ''}`),
  crear: (data: { nombre: string; rol: 'admin' | 'encargado'; sectorId?: string; password: string }) =>
    apiFetch<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id: string, data: Partial<{ nombre: string; sectorId: string; password: string }>) =>
    apiFetch<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminar: (id: string) => apiFetch(`/usuarios/${id}`, { method: 'DELETE' }),
};

export const movimientosApi = {
  declararGenerado: (data: { fechaTrabajo: string; diaTrabajado?: string; comentario?: string }) =>
    apiFetch<Movimiento>('/movimientos/generado', { method: 'POST', body: JSON.stringify(data) }),
  solicitarConsumido: (data: { fechaDeseada: string; turno?: string; comentario?: string }) =>
    apiFetch<Movimiento>('/movimientos/consumido', { method: 'POST', body: JSON.stringify(data) }),
  registrarGuardia: (data: { guardiaDesde: string; guardiaHasta: string; cantidad: number; guardiaNovedades?: string }) =>
    apiFetch<Movimiento>('/movimientos/guardia', { method: 'POST', body: JSON.stringify(data) }),
  ajuste: (data: { tecnicoId: string; cantidad: number; motivoAjuste: string }) =>
    apiFetch<Movimiento>('/movimientos/ajuste', { method: 'POST', body: JSON.stringify(data) }),
  mios: () => apiFetch<Movimiento[]>('/movimientos/mios'),
  saldo: (tecnicoId: string) => apiFetch<{ tecnicoId: string; saldo: number }>(`/movimientos/saldo/${tecnicoId}`),
  deMiSector: (estado?: string) => apiFetch<Movimiento[]>(`/movimientos/sector${estado ? `?estado=${estado}` : ''}`),
  todos: (estado?: string) => apiFetch<Movimiento[]>(`/movimientos${estado ? `?estado=${estado}` : ''}`),
  aprobar: (id: string) => apiFetch<Movimiento>(`/movimientos/${id}/aprobar`, { method: 'PATCH' }),
  rechazar: (id: string, motivoRechazo: string) =>
    apiFetch<Movimiento>(`/movimientos/${id}/rechazar`, { method: 'PATCH', body: JSON.stringify({ motivoRechazo }) }),
  exportCsvUrl: () => `${API_URL}/movimientos/export/csv`,
};

export { API_URL, ApiError };
