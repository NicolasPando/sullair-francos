'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSesion } from '@/lib/useSesion';
import { movimientosApi } from '@/lib/api';
import { EstadoMovimiento, Movimiento, SaldoTecnico, TipoMovimiento } from '@/lib/types';
import { useToast } from '@/components/Toast';
import SessionHeader from '@/components/SessionHeader';
import MovimientoCard from '@/components/MovimientoCard';
import Calendar from '@/components/Calendar';
import AjusteModal from '@/components/AjusteModal';
import HistorialFiltros from '@/components/HistorialFiltros';
import CronosChip from '@/components/CronosChip';

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
  const [rechazando, setRechazando] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState<SaldoTecnico | null>(null);

  const [filtroTipo, setFiltroTipo] = useState<TipoMovimiento | 'todos'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<EstadoMovimiento | 'todos'>('todos');
  const [filtroTecnicoId, setFiltroTecnicoId] = useState('');

  useEffect(() => {
    if (listo) cargar();
  }, [listo, tab]);

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

  const historialFiltrado = useMemo(() => {
    return historial.filter((m) => {
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false;
      if (filtroEstado !== 'todos' && m.estado !== filtroEstado) return false;
      if (filtroTecnicoId && m.tecnico.id !== filtroTecnicoId) return false;
      return true;
    });
  }, [historial, filtroTipo, filtroEstado, filtroTecnicoId]);

  async function aprobar(id: string) {
    setProcesando(id);
    try {
      await movimientosApi.aprobar(id);
      toast('Movimiento aprobado.', 's');
      cargar();
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setProcesando(null);
    }
  }

  async function rechazar(id: string, motivo: string) {
    if (!motivo.trim()) { toast('Indicá un motivo de rechazo.', 'e'); return; }
    setProcesando(id);
    try {
      await movimientosApi.rechazar(id, motivo);
      toast('Movimiento rechazado.', 's');
      setRechazando(null);
      cargar();
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setProcesando(null);
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
          pendientes.length === 0 ? (
            <div className="empty">No hay movimientos pendientes en tu sector.</div>
          ) : (
            pendientes.map((m) => (
              <MovimientoCard
                key={m.id}
                movimiento={m}
                mostrarTecnico
                acciones={
                  rechazando === m.id ? (
                    <RechazoInline
                      onCancelar={() => setRechazando(null)}
                      onConfirmar={(motivo) => rechazar(m.id, motivo)}
                      procesando={procesando === m.id}
                    />
                  ) : (
                    <div className="btn-row" style={{ width: '100%' }}>
                      <button className="btn btn-ok btn-sm" disabled={procesando === m.id} onClick={() => aprobar(m.id)}>Aprobar</button>
                      <button className="btn btn-danger btn-sm" disabled={procesando === m.id} onClick={() => setRechazando(m.id)}>Rechazar</button>
                    </div>
                  )
                }
              />
            ))
          )
        ) : tab === 'tecnicos' ? (
          tecnicos.length === 0 ? (
            <div className="empty">No hay técnicos en tu sector todavía.</div>
          ) : (
            tecnicos.map((t) => (
              <div className="mv" key={t.tecnicoId}>
                <div className="mv-top">
                  <div>
                    <div className="mv-tipo">{t.nombre}</div>
                    <div className="mv-tec">{t.activo ? 'Activo' : 'Inactivo'}</div>
                  </div>
                  <div className="mv-cant" style={{ color: t.saldo < 0 ? 'var(--red)' : 'inherit' }}>{t.saldo}</div>
                </div>
                <div className="mv-acts">
                  <button className="btn btn-sec btn-sm" onClick={() => setAjustando(t)}>Ajuste de saldo</button>
                </div>
              </div>
            ))
          )
        ) : (
          <>
            <CronosChip movimientos={historial} />
            <HistorialFiltros
              tipo={filtroTipo}
              onTipo={setFiltroTipo}
              estado={filtroEstado}
              onEstado={setFiltroEstado}
              tecnicoId={filtroTecnicoId}
              onTecnico={setFiltroTecnicoId}
              tecnicos={tecnicos.map((t) => ({ id: t.tecnicoId, nombre: t.nombre }))}
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

function RechazoInline({
  onCancelar,
  onConfirmar,
  procesando,
}: {
  onCancelar: () => void;
  onConfirmar: (motivo: string) => void;
  procesando: boolean;
}) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="rej-form" style={{ width: '100%' }}>
      <div className="f">
        <label>Motivo del rechazo</label>
        <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      <div className="btn-row">
        <button className="btn btn-ghost btn-sm" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-danger btn-sm" disabled={procesando} onClick={() => onConfirmar(motivo)}>Confirmar rechazo</button>
      </div>
    </div>
  );
}
