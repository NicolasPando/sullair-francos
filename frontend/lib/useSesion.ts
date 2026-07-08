'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerUsuario, cerrarSesion } from './session';
import { SesionUsuario, Rol } from './types';

export function useSesion(rolRequerido: Rol) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const u = obtenerUsuario();
    if (!u || u.rol !== rolRequerido) {
      router.replace('/');
      return;
    }
    setUsuario(u);
    setListo(true);
  }, [rolRequerido, router]);

  function salir() {
    cerrarSesion();
    router.replace('/');
  }

  return { usuario, listo, salir };
}
