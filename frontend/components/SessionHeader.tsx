'use client';

import { SesionUsuario } from '@/lib/types';

const ETIQUETA_ROL: Record<string, string> = {
  tecnico: 'Técnico',
  encargado: 'Encargado de sector',
  admin: 'Administración',
};

export default function SessionHeader({ usuario, onSalir }: { usuario: SesionUsuario; onSalir: () => void }) {
  return (
    <>
      <div className="brand">
        <p className="ey">Sullair Argentina · Servicio Técnico</p>
        <h1>Gestión de Francos y Guardias</h1>
      </div>
      <div className="sess">
        <div className="sess-who">
          <b>{usuario.nombre}</b>
          <small>{ETIQUETA_ROL[usuario.rol]}</small>
        </div>
        <button className="out-btn" onClick={onSalir}>Salir</button>
      </div>
    </>
  );
}
