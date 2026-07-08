'use client';

import { useEffect, useState } from 'react';
import { useSesion } from '@/lib/useSesion';
import { movimientosApi, sectoresApi, tecnicosApi, usuariosApi } from '@/lib/api';
import { Movimiento, Sector, Tecnico, Usuario } from '@/lib/types';
import { useToast } from '@/components/Toast';
import SessionHeader from '@/components/SessionHeader';
import MovimientoCard from '@/components/MovimientoCard';
import Modal from '@/components/Modal';

type Tab = 'resumen' | 'movimientos' | 'tecnicos' | 'sectores' | 'usuarios';

export default function AdminPage() {
  const { usuario, listo, salir } = useSesion('admin');
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('resumen');

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalTecnico, setModalTecnico] = useState<null | 'nuevo'>(null);
  const [modalSector, setModalSector] = useState(false);
  const [modalUsuario, setModalUsuario] = useState<null | 'encargado' | 'admin'>(null);
  const [modalAjuste, setModalAjuste] = useState<Tecnico | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (listo) cargarTodo();
  }, [listo]);

  async function cargarTodo() {
    setCargando(true);
    try {
      const [mov, tec, sec, usr] = await Promise.all([
        movimientosApi.todos(),
        tecnicosApi.listar(),
        sectoresApi.listar(),
        usuariosApi.listar(),
      ]);
      setMovimientos(mov);
      setTecnicos(tec);
      setSectores(sec);
      setUsuarios(usr);
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setCargando(false);
    }
  }

  const pendientes = movimientos.filter((m) => m.estado === 'pendiente').length;
  const aprobados = movimientos.filter((m) => m.estado === 'aprobado').length;

  if (!listo || !usuario) return null;

  return (
    <>
      <SessionHeader usuario={usuario} onSalir={salir} />
      <main className="sp">
        <div className="tabs">
          <button className={`tab ${tab === 'resumen' ? 'on' : ''}`} onClick={() => setTab('resumen')}>Resumen</button>
          <button className={`tab ${tab === 'movimientos' ? 'on' : ''}`} onClick={() => setTab('movimientos')}>Movimientos</button>
          <button className={`tab ${tab === 'tecnicos' ? 'on' : ''}`} onClick={() => setTab('tecnicos')}>Técnicos</button>
          <button className={`tab ${tab === 'sectores' ? 'on' : ''}`} onClick={() => setTab('sectores')}>Sectores</button>
          <button className={`tab ${tab === 'usuarios' ? 'on' : ''}`} onClick={() => setTab('usuarios')}>Usuarios</button>
        </div>

        {cargando ? (
          <div className="lw"><div className="spinr" /></div>
        ) : (
          <>
            {tab === 'resumen' && (
              <>
                <div className="sg">
                  <div className="sb"><div className="n">{tecnicos.length}</div><div className="l">Técnicos</div></div>
                  <div className="sb"><div className="n">{sectores.length}</div><div className="l">Sectores</div></div>
                  <div className="sb"><div className="n">{pendientes}</div><div className="l">Pendientes</div></div>
                  <div className="sb"><div className="n">{aprobados}</div><div className="l">Aprobados</div></div>
                </div>
                <a className="btn btn-sec" href={movimientosApi.exportCsvUrl()} target="_blank" rel="noreferrer"
                   onClick={(e) => { e.preventDefault(); descargarCsv(); }}>
                  Exportar movimientos a CSV
                </a>
              </>
            )}

            {tab === 'movimientos' && (
              movimientos.length === 0
                ? <div className="empty">Todavía no hay movimientos cargados.</div>
                : movimientos.map((m) => <MovimientoCard key={m.id} movimiento={m} mostrarTecnico />)
            )}

            {tab === 'tecnicos' && (
              <>
                <button className="btn btn-sec" style={{ marginBottom: 12 }} onClick={() => setModalTecnico('nuevo')}>
                  + Nuevo técnico
                </button>
                {tecnicos.map((t) => (
                  <div className="mv" key={t.id}>
                    <div className="mv-top">
                      <div>
                        <div className="mv-tipo">{t.nombre}</div>
                        <div className="mv-tec">{t.sector?.nombre}</div>
                      </div>
                      <span className={`badge ${t.activo ? 'ba' : 'br'}`}>{t.activo ? 'activo' : 'inactivo'}</span>
                    </div>
                    <div className="mv-acts">
                      <button className="btn btn-sec btn-sm" onClick={() => setModalAjuste(t)}>Ajustar saldo</button>
                      <button
                        className={`btn btn-sm ${t.activo ? 'btn-danger' : 'btn-ok'}`}
                        onClick={async () => {
                          try { await tecnicosApi.toggleActivo(t.id); toast('Actualizado.', 's'); cargarTodo(); }
                          catch (err: any) { toast(err.message, 'e'); }
                        }}
                      >
                        {t.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === 'sectores' && (
              <>
                <button className="btn btn-sec" style={{ marginBottom: 12 }} onClick={() => setModalSector(true)}>
                  + Nuevo sector
                </button>
                {sectores.map((s) => (
                  <div className="mv" key={s.id}>
                    <div className="mv-top">
                      <div className="mv-tipo">{s.nombre}</div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          try { await sectoresApi.eliminar(s.id); toast('Sector eliminado.', 's'); cargarTodo(); }
                          catch (err: any) { toast(err.message, 'e'); }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === 'usuarios' && (
              <>
                <div className="btn-row" style={{ marginBottom: 12 }}>
                  <button className="btn btn-sec" onClick={() => setModalUsuario('encargado')}>+ Encargado</button>
                  <button className="btn btn-sec" onClick={() => setModalUsuario('admin')}>+ Admin</button>
                </div>
                {usuarios.map((u) => (
                  <div className="mv" key={u.id}>
                    <div className="mv-top">
                      <div>
                        <div className="mv-tipo">{u.nombre}</div>
                        <div className="mv-tec">{u.rol === 'admin' ? 'Administrador' : u.sector?.nombre}</div>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          try { await usuariosApi.eliminar(u.id); toast('Usuario eliminado.', 's'); cargarTodo(); }
                          catch (err: any) { toast(err.message, 'e'); }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </main>

      {modalTecnico === 'nuevo' && (
        <Modal titulo="Nuevo técnico" onClose={() => setModalTecnico(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setEnviando(true);
            try {
              await tecnicosApi.crear({
                nombre: String(f.get('nombre')),
                sectorId: String(f.get('sectorId')),
                pin: String(f.get('pin') || '') || undefined,
              });
              toast('Técnico creado.', 's');
              setModalTecnico(null);
              cargarTodo();
            } catch (err: any) { toast(err.message, 'e'); }
            finally { setEnviando(false); }
          }}>
            <div className="f">
              <label>Nombre completo</label>
              <input name="nombre" required />
            </div>
            <div className="f">
              <label>Sector</label>
              <select name="sectorId" required defaultValue="">
                <option value="">Seleccionar…</option>
                {sectores.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="f">
              <label>PIN (opcional, 4 dígitos)</label>
              <input name="pin" maxLength={4} inputMode="numeric" />
              <div className="hint">Si lo dejás vacío, el técnico entra solo eligiendo su nombre.</div>
            </div>
            <button className="btn btn-pri" type="submit" disabled={enviando}>Crear</button>
          </form>
        </Modal>
      )}

      {modalSector && (
        <Modal titulo="Nuevo sector" onClose={() => setModalSector(false)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setEnviando(true);
            try {
              await sectoresApi.crear(String(f.get('nombre')));
              toast('Sector creado.', 's');
              setModalSector(false);
              cargarTodo();
            } catch (err: any) { toast(err.message, 'e'); }
            finally { setEnviando(false); }
          }}>
            <div className="f">
              <label>Nombre del sector</label>
              <input name="nombre" required />
            </div>
            <button className="btn btn-pri" type="submit" disabled={enviando}>Crear</button>
          </form>
        </Modal>
      )}

      {modalUsuario && (
        <Modal titulo={modalUsuario === 'admin' ? 'Nuevo administrador' : 'Nuevo encargado'} onClose={() => setModalUsuario(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setEnviando(true);
            try {
              await usuariosApi.crear({
                nombre: String(f.get('nombre')),
                rol: modalUsuario,
                sectorId: modalUsuario === 'encargado' ? String(f.get('sectorId')) : undefined,
                password: String(f.get('password')),
              });
              toast('Usuario creado.', 's');
              setModalUsuario(null);
              cargarTodo();
            } catch (err: any) { toast(err.message, 'e'); }
            finally { setEnviando(false); }
          }}>
            <div className="f">
              <label>Nombre completo</label>
              <input name="nombre" required />
            </div>
            {modalUsuario === 'encargado' && (
              <div className="f">
                <label>Sector a cargo</label>
                <select name="sectorId" required defaultValue="">
                  <option value="">Seleccionar…</option>
                  {sectores.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
            <div className="f">
              <label>Contraseña</label>
              <input name="password" type="password" minLength={4} required />
            </div>
            <button className="btn btn-pri" type="submit" disabled={enviando}>Crear</button>
          </form>
        </Modal>
      )}

      {modalAjuste && (
        <Modal titulo={`Ajustar saldo — ${modalAjuste.nombre}`} onClose={() => setModalAjuste(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setEnviando(true);
            try {
              await movimientosApi.ajuste({
                tecnicoId: modalAjuste.id,
                cantidad: Number(f.get('cantidad')),
                motivoAjuste: String(f.get('motivoAjuste')),
              });
              toast('Ajuste aplicado.', 's');
              setModalAjuste(null);
              cargarTodo();
            } catch (err: any) { toast(err.message, 'e'); }
            finally { setEnviando(false); }
          }}>
            <div className="f">
              <label>Cantidad (positiva suma, negativa resta)</label>
              <input name="cantidad" type="number" step="0.5" required />
            </div>
            <div className="f">
              <label>Motivo</label>
              <textarea name="motivoAjuste" rows={2} required />
            </div>
            <button className="btn btn-pri" type="submit" disabled={enviando}>Aplicar ajuste</button>
          </form>
        </Modal>
      )}
    </>
  );

  async function descargarCsv() {
    try {
      const token = localStorage.getItem('sullair_token');
      const res = await fetch(movimientosApi.exportCsvUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sullair_movimientos_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast('No se pudo descargar el CSV.', 'e');
    }
  }
}
