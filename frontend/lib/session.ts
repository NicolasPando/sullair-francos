'use client';

import { SesionUsuario } from './types';

const TOKEN_KEY = 'sullair_token';
const USER_KEY = 'sullair_user';

export function guardarSesion(token: string, user: SesionUsuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function obtenerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function obtenerUsuario(): SesionUsuario | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function rutaSegunRol(rol: string): string {
  if (rol === 'admin') return '/admin';
  if (rol === 'encargado') return '/encargado';
  return '/tecnico';
}
