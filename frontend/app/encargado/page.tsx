'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSesion } from '@/lib/useSesion';
import { movimientosApi } from '@/lib/api';
import { Movimiento, SaldoTecnico, Sector } from '@/lib/types';
import { FILTROS_INICIALES, FiltrosMovimientos, filtrarMovimientos } from '@/lib/filtros';
import { useToast } from '@/components/Toast';
import SessionHeader from '@/components/SessionHeader';
import MovimientoCard from '@/components/MovimientoCard';
import Calendar from '@/components/Calendar';
import AjusteModal from '@/components/AjusteModal';
import HistorialFiltros from '@/components/HistorialFiltros';
import CronosChip from '@/components/CronosChip';
import SectorPills from '@/components/SectorPills';
import AccionesPendiente from '@/components/AccionesPendiente';

type Tab = 'pendientes' | 'tecnicos' | 'historial';
type TabHistorial = 'lista' | 'calendario';

export default function EncargadoPage() {
  const { usuario, listo, salir } = useSesion('encargado');
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('pendientes');
  const [subTabHistorial, setSubTabHistorial] = useState<TabHistorial>('lista');

  const [pendientes, setPendientes] = useState<Movimiento[]>([]);
  const [historial, setHistorial] = useState<Movimiento[]>([]);
  const [tecnicos, setTecnicos] = useState<SaldoTecnico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ajustando, setAjustando] = useState<SaldoTecnico | null>(null);

  const [filtros, setFiltros] = useState<FiltrosMovimientos>(FILTROS_INICIALES);
  const [sectorPendientes, setSectorPendientes] = useState('');
  const [sectorTecnicos, setSectorTecnicos] = useState('');
  const [tecnicoBuscado, setTecnicoBuscado] = useState('');

  useEffect(() => {
    if (listo) cargar();
  }, [listo, tab]);

  // La lista de técnicos (con saldo) sirve para los filtros de todas las tabs
  useEffect(() => {
    if (listo) movimientosApi.saldos().then(setTecnicos).catch(() => {});
  }, [listo]);

  async function cargar() {
    setCargando(true);
    try {
      if (tab === 'pendientes') {
        setPendientes(await movimientosApi.deMiSector('pendiente'));
      } else if (tab === 'tecnicos') {
        setTecnicos(await movimientosApi.saldos());
      } else {
        setHistorial(await movimientosApi.deMiSector());
      }
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setCargando(false);
    }
  }

  // Sectores asignados al encargado (se deducen de sus técnicos)
  const sectores: Sector[] = useMemo(() => {
    const mapa = new Map<string, Sector>();
    tecnicos.forEach((t) => { if (t.sectorId && t.sector) mapa.set(t.sectorId, { id: t.sectorId, nombre: t.sector }); });
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tecnicos]);

  const pendientesVisibles = useMemo(
    () => pendientes.filter((m) => !sectorPendientes || m.tecnico.sector?.id === sectorPendientes),
    [pendientes, sectorPendientes],
  );
  const historialFiltrado = useMemo(() => filtrarMovimientos(historial, filtros), [historial, filtros]);
  const tecnicosVisibles = useMemo(
    () => tecnicos.filter((t) => (!sectorTecnicos || t.sectorId === sectorTecnicos) && (!tecnicoBuscado || t.tecnicoId === tecnicoBuscado)),
    [tecnicos, sectorTecnicos, tecnicoBuscado],
  );
  const opcionesTecnico = useMemo(
    () => tecnicos.filter((t) => !sectorTecnicos || t.sectorId === sectorTecnicos),
    [tecnicos, sectorTecnicos],
  );

  function cambiarFiltro<K extends keyof FiltrosMovimientos>(clave: K, valor: FiltrosMovimientos[K]) {
    // al cambiar de sector, el técnico elegido puede no pertenecer a ese sector: se limpia
    setFiltros((f) => ({ ...f, [clave]: valor, ...(clave === 'sectorId' ? { tecnicoId: '' } : {}) }));
  }

  async function aprobar(id: string) {
    try {
      await movimientosApi.aprobar(id);
      toast('Movimiento aprobado.', 's');
      cargar();
    } catch (err: any) {
      toast(err.message, 'e');
    }
  }

  async function rechazar(id: string, motivo: string) {
    try {
      await movimientosApi.rechazar(id, motivo);
      toast('Movimiento rechazado.', 's');
      cargar();
    } catch (err: any) {
      toast(err.message, 'e');
    }
  }

  async function toggleCronos(id: string) {
    try {
      await movimientosApi.toggleCronos(id);
      cargar();
    } catch (err: any) {
      toast(err.message, 'e');
    }
  }

  if (!listo || !usuario) return null;

  return (
    <>
      <SessionHeader usuario={usuario} onSalir={salir} />
      <main className="sp">
        <div className="tabs">
          <button className={`tab ${tab === 'pendientes' ? 'on' : ''}`} onClick={() => setTab('pendientes')}>Pendientes</button>
          <button className={`tab ${tab === 'tecnicos' ? 'on' : ''}`} onClick={() => setTab('tecnicos')}>Técnicos</button>
          <button className={`tab ${tab === 'historial' ? 'on' : ''}`} onClick={() => setTab('historial')}>Historial</button>
        </div>

        {cargando ? (
          <div className="lw"><div className="spinr" /></div>
        ) : tab === 'pendientes' ? (
          <>
            {sectores.length > 1 && (
              <div className="hist-filters"><SectorPills sectores={sectores} value={sectorPendientes} onChange={setSectorPendientes} /></div>
            )}
            {pendientesVisibles.length === 0 ? (
              <div className="empty">No hay movimientos pendientes{sectorPendientes ? ' en ese sector' : ' en tus sectores'}.</div>
            ) : (
              pendientesVisibles.map((m) => (
                <MovimientoCard
                  key={m.id}
                  movimiento={m}
                  mostrarTecnico
                  acciones={<AccionesPendiente onAprobar={() => aprobar(m.id)} onRechazar={(motivo) => rechazar(m.id, motivo)} />}
                />
              ))
            )}
          </>
        ) : tab === 'tecnicos' ? (
          <>
            <div className="hist-filters">
              <SectorPills
                sectores={sectores}
                value={sectorTecnicos}
                onChange={(id) => { setSectorTecnicos(id); setTecnicoBuscado(''); }}
              />
              <div className="f-pills-row">
                <span className="f-pill-label">Técnico:</span>
                <select className="f-tec-sel" value={tecnicoBuscado} onChange={(e) => setTecnicoBuscado(e.target.value)}>
                  <option value="">Todos</option>
                  {opcionesTecnico.map((t) => <option key={t.tecnicoId} value={t.tecnicoId}>{t.nombre}</option>)}
                </select>
              </div>
            </div>
            {tecnicosVisibles.length === 0 ? (
              <div className="empty">No hay técnicos para mostrar.</div>
            ) : (
              tecnicosVisibles.map((t) => (
                <div className="mv" key={t.tecnicoId}>
                  <div className="tec-line">
                    <span className="mv-tipo">{t.nombre}</span>
                    <span className={`saldo-pill ${t.saldo < 0 ? 'neg' : ''}`} title="Francos restantes">{t.saldo}</span>
                  </div>
                  <div className="mv-tec">{t.sector}{t.activo ? '' : ' · Inactivo'}</div>
                  <div className="mv-acts">
                    <button className="btn btn-sec btn-sm" onClick={() => setAjustando(t)}>Ajuste de saldo</button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <CronosChip movimientos={historial} />
            <HistorialFiltros
              tipo={filtros.tipo}
              onTipo={(v) => cambiarFiltro('tipo', v)}
              estado={filtros.estado}
              onEstado={(v) => cambiarFiltro('estado', v)}
              cronos={filtros.cronos}
              onCronos={(v) => cambiarFiltro('cronos', v)}
              sectores={sectores}
              sectorId={filtros.sectorId}
              onSector={(v) => cambiarFiltro('sectorId', v)}
              tecnicoId={filtros.tecnicoId}
              onTecnico={(v) => cambiarFiltro('tecnicoId', v)}
              tecnicos={tecnicos.map((t) => ({ id: t.tecnicoId, nombre: t.nombre, sector: t.sector, sectorId: t.sectorId }))}
            />
            <div className="cal-sub">
              <button className={`cal-sub-btn ${subTabHistorial === 'lista' ? 'on' : ''}`} onClick={() => setSubTabHistorial('lista')}>Lista</button>
              <button className={`cal-sub-btn ${subTabHistorial === 'calendario' ? 'on' : ''}`} onClick={() => setSubTabHistorial('calendario')}>Calendario</button>
            </div>
            {subTabHistorial === 'calendario' ? (
              <Calendar movimientos={historialFiltrado} />
            ) : historialFiltrado.length === 0 ? (
              <div className="empty">Sin movimientos para mostrar.</div>
            ) : (
              historialFiltrado.map((m) => (
                <MovimientoCard key={m.id} movimiento={m} mostrarTecnico onToggleCronos={toggleCronos} />
              ))
            )}
          </>
        )}
      </main>

      {ajustando && (
        <AjusteModal
          tecnicoId={ajustando.tecnicoId}
          tecnicoNombre={ajustando.nombre}
          onClose={() => setAjustando(null)}
          onListo={() => { setAjustando(null); cargar(); }}
        />
      )}
    </>
  );
}
