'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { guardarSesion, rutaSegunRol } from '@/lib/session';
import { useToast } from '@/components/Toast';

type Paso = 'cargando' | 'setup' | 'roles' | 'tecnico' | 'encargado' | 'admin';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [paso, setPaso] = useState<Paso>('cargando');
  const [cargandoAccion, setCargandoAccion] = useState(false);

  useEffect(() => {
    cargarEstado();
  }, []);

  async function cargarEstado() {
    try {
      const { setupPendiente } = await authApi.opciones();
      setPaso(setupPendiente ? 'setup' : 'roles');
    } catch (err: any) {
      toast(`No se pudo conectar con el servidor: ${err.message}`, 'e');
    }
  }

  function irADashboard(rol: string) {
    router.push(rutaSegunRol(rol));
  }

  async function onSetup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const password2 = (form.elements.namedItem('password2') as HTMLInputElement).value;
    if (password !== password2) { toast('Las contraseñas no coinciden.', 'e'); return; }

    setCargandoAccion(true);
    try {
      const { token, user } = await authApi.setup(nombre, password);
      guardarSesion(token, user);
      toast('Listo. Ahora podés cargar técnicos y sectores.', 's');
      irADashboard(user.rol);
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setCargandoAccion(false);
    }
  }

  async function onLoginTecnico(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value.trim();
    const pin = (form.elements.namedItem('pin') as HTMLInputElement).value;
    if (!nombre) { toast('Escribí tu nombre.', 'e'); return; }

    setCargandoAccion(true);
    try {
      const { token, user } = await authApi.loginTecnico(nombre, pin || undefined);
      guardarSesion(token, user);
      irADashboard(user.rol);
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setCargandoAccion(false);
    }
  }

  async function onLoginUsuario(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    if (!nombre) { toast('Escribí tu nombre.', 'e'); return; }

    setCargandoAccion(true);
    try {
      const { token, user } = await authApi.loginUsuario(nombre, password);
      guardarSesion(token, user);
      irADashboard(user.rol);
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setCargandoAccion(false);
    }
  }

  return (
    <>
      <div className="brand">
        <p className="ey">Sullair Argentina · Servicio Técnico</p>
        <h1>Gestión de Francos y Guardias</h1>
      </div>

      <main className="sp">
        {paso === 'cargando' && (
          <div className="lw">
            <div className="spinr" />
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Conectando con el servidor…</div>
          </div>
        )}

        {paso === 'setup' && (
          <div className="card">
            <h2>Primer acceso</h2>
            <p style={{ fontSize: 13, color: '#4A5057', lineHeight: 1.6, marginBottom: 14 }}>
              Todavía no hay administradores cargados. Creá el primer usuario administrador para empezar.
            </p>
            <form onSubmit={onSetup}>
              <div className="f">
                <label>Tu nombre completo</label>
                <input name="nombre" type="text" required placeholder="Ej: Mauro Palazzo" />
              </div>
              <div className="f">
                <label>Contraseña</label>
                <input name="password" type="password" minLength={4} required />
              </div>
              <div className="f">
                <label>Repetí la contraseña</label>
                <input name="password2" type="password" minLength={4} required />
              </div>
              <button className="btn btn-pri" type="submit" disabled={cargandoAccion}>Crear acceso y empezar</button>
            </form>
          </div>
        )}

        {paso === 'roles' && (
          <div className="card">
            <div className="role-grid">
              <button className="role-card" onClick={() => setPaso('tecnico')}>
                <span className="num">01</span>
                <div className="ttl">Técnico</div>
                <div className="dsc">Ver saldo, declarar francos y registrar guardias pasivas.</div>
              </button>
              <button className="role-card" onClick={() => setPaso('encargado')}>
                <span className="num">02</span>
                <div className="ttl">Encargado de sector</div>
                <div className="dsc">Aprobar francos y guardias de tus técnicos.</div>
              </button>
              <button className="role-card" onClick={() => setPaso('admin')}>
                <span className="num">03</span>
                <div className="ttl">Administración</div>
                <div className="dsc">Vista global, sectores, admins y ajustes de saldo.</div>
              </button>
            </div>
          </div>
        )}

        {paso === 'tecnico' && (
          <div className="card">
            <form onSubmit={onLoginTecnico}>
              <div className="f">
                <label>Tu nombre completo</label>
                <input name="nombre" type="text" required autoFocus placeholder="Como te cargó el admin" />
              </div>
              <div className="f">
                <label>PIN (si tenés uno cargado)</label>
                <input name="pin" type="password" inputMode="numeric" maxLength={4} placeholder="Dejalo vacío si no tenés PIN" />
              </div>
              <button className="btn btn-pri" type="submit" disabled={cargandoAccion}>Ingresar</button>
            </form>
            <div style={{ marginTop: 12 }}>
              <button className="lnk" onClick={() => setPaso('roles')}>← Volver</button>
            </div>
          </div>
        )}

        {paso === 'encargado' && (
          <div className="card">
            <form onSubmit={onLoginUsuario}>
              <div className="f">
                <label>Tu nombre completo</label>
                <input name="nombre" type="text" required autoFocus />
              </div>
              <div className="f">
                <label>Contraseña</label>
                <input name="password" type="password" required />
              </div>
              <button className="btn btn-pri" type="submit" disabled={cargandoAccion}>Ingresar</button>
            </form>
            <div style={{ marginTop: 12 }}>
              <button className="lnk" onClick={() => setPaso('roles')}>← Volver</button>
            </div>
          </div>
        )}

        {paso === 'admin' && (
          <div className="card">
            <form onSubmit={onLoginUsuario}>
              <div className="f">
                <label>Tu nombre completo</label>
                <input name="nombre" type="text" required autoFocus />
              </div>
              <div className="f">
                <label>Contraseña</label>
                <input name="password" type="password" required />
              </div>
              <button className="btn btn-pri" type="submit" disabled={cargandoAccion}>Ingresar</button>
            </form>
            <div style={{ marginTop: 12 }}>
              <button className="lnk" onClick={() => setPaso('roles')}>← Volver</button>
            </div>
          </div>
        )}
      </main>
      <p className="fn">Base de datos: PostgreSQL · API propia (NestJS)</p>
    </>
  );
}
