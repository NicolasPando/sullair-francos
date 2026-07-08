'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { guardarSesion, rutaSegunRol } from '@/lib/session';
import { Opciones } from '@/lib/types';
import { useToast } from '@/components/Toast';

type Paso = 'cargando' | 'setup' | 'roles' | 'tecnico' | 'encargado' | 'admin';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [paso, setPaso] = useState<Paso>('cargando');
  const [opciones, setOpciones] = useState<Opciones | null>(null);
  const [cargandoAccion, setCargandoAccion] = useState(false);

  useEffect(() => {
    cargarOpciones();
  }, []);

  async function cargarOpciones() {
    try {
      const opc = await authApi.opciones();
      setOpciones(opc);
      setPaso(opc.setupPendiente ? 'setup' : 'roles');
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
    const tecnicoId = (form.elements.namedItem('tecnicoId') as HTMLSelectElement).value;
    const pin = (form.elements.namedItem('pin') as HTMLInputElement | null)?.value;
    if (!tecnicoId) { toast('Elegí un técnico.', 'e'); return; }

    setCargandoAccion(true);
    try {
      const { token, user } = await authApi.loginTecnico(tecnicoId, pin);
      guardarSesion(token, user);
      irADashboard(user.rol);
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setCargandoAccion(false);
    }
  }

  async function onLoginUsuario(e: React.FormEvent<HTMLFormElement>, tipo: 'encargado' | 'admin') {
    e.preventDefault();
    const form = e.currentTarget;
    const usuarioId = (form.elements.namedItem('usuarioId') as HTMLSelectElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    if (!usuarioId) { toast(`Elegí un ${tipo === 'admin' ? 'administrador' : 'encargado'}.`, 'e'); return; }

    setCargandoAccion(true);
    try {
      const { token, user } = await authApi.loginUsuario(usuarioId, password);
      guardarSesion(token, user);
      irADashboard(user.rol);
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setCargandoAccion(false);
    }
  }

  const tecnicoSeleccionado = (id: string) => opciones?.tecnicos.find((t) => t.id === id);

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

        {paso === 'tecnico' && opciones && (
          <div className="card">
            {opciones.tecnicos.length === 0 ? (
              <div className="empty">No hay técnicos cargados todavía.</div>
            ) : (
              <FormularioTecnico opciones={opciones.tecnicos} onSubmit={onLoginTecnico} cargando={cargandoAccion} />
            )}
            <div style={{ marginTop: 12 }}>
              <button className="lnk" onClick={() => setPaso('roles')}>← Volver</button>
            </div>
          </div>
        )}

        {paso === 'encargado' && opciones && (
          <div className="card">
            <FormularioUsuario
              opciones={opciones.encargados}
              placeholder="encargado"
              onSubmit={(e) => onLoginUsuario(e, 'encargado')}
              cargando={cargandoAccion}
            />
            <div style={{ marginTop: 12 }}>
              <button className="lnk" onClick={() => setPaso('roles')}>← Volver</button>
            </div>
          </div>
        )}

        {paso === 'admin' && opciones && (
          <div className="card">
            {opciones.admins.length === 0 ? (
              <div className="empty">No hay administradores.</div>
            ) : (
              <FormularioUsuario
                opciones={opciones.admins}
                placeholder="administrador"
                onSubmit={(e) => onLoginUsuario(e, 'admin')}
                cargando={cargandoAccion}
              />
            )}
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

function FormularioTecnico({
  opciones,
  onSubmit,
  cargando,
}: {
  opciones: Opciones['tecnicos'];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  cargando: boolean;
}) {
  const [tecnicoId, setTecnicoId] = useState('');
  const tecnico = opciones.find((t) => t.id === tecnicoId);

  return (
    <form onSubmit={onSubmit}>
      <div className="f">
        <label>Tu nombre</label>
        <select
          name="tecnicoId"
          required
          value={tecnicoId}
          onChange={(e) => setTecnicoId(e.target.value)}
        >
          <option value="">Seleccionar…</option>
          {opciones.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre} — {t.sector}</option>
          ))}
        </select>
      </div>
      {tecnico?.requierePin && (
        <div className="f">
          <label>PIN (4 dígitos)</label>
          <input name="pin" type="password" inputMode="numeric" maxLength={4} required />
        </div>
      )}
      <button className="btn btn-pri" type="submit" disabled={cargando}>Ingresar</button>
    </form>
  );
}

function FormularioUsuario({
  opciones,
  placeholder,
  onSubmit,
  cargando,
}: {
  opciones: { id: string; nombre: string }[];
  placeholder: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  cargando: boolean;
}) {
  if (opciones.length === 0) return <div className="empty">No hay {placeholder}s cargados.</div>;
  return (
    <form onSubmit={onSubmit}>
      <div className="f">
        <label>{placeholder === 'administrador' ? 'Administrador' : 'Tu nombre'}</label>
        <select name="usuarioId" required defaultValue="">
          <option value="">Seleccionar…</option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </select>
      </div>
      <div className="f">
        <label>Contraseña</label>
        <input name="password" type="password" required autoFocus />
      </div>
      <button className="btn btn-pri" type="submit" disabled={cargando}>Ingresar</button>
    </form>
  );
}
