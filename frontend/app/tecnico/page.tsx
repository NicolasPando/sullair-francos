'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSesion } from '@/lib/useSesion';
import { movimientosApi } from '@/lib/api';
import { DiaGuardia, FechaSolicitada, Movimiento, TipoMovimiento, Turno } from '@/lib/types';
import { useToast } from '@/components/Toast';
import SessionHeader from '@/components/SessionHeader';
import MovimientoCard from '@/components/MovimientoCard';
import Modal from '@/components/Modal';
import Calendar from '@/components/Calendar';
import HistorialFiltros from '@/components/HistorialFiltros';

type ModalAbierto = null | 'generado' | 'consumido' | 'guardia';
type TabHistorial = 'lista' | 'calendario';

const DS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function diaSemana(fecha: string): number {
  return new Date(`${fecha}T00:00:00`).getDay();
}
function esFinDeSemana(fecha: string): boolean {
  const d = diaSemana(fecha);
  return d === 0 || d === 6;
}
function fechasEnRango(desde: string, hasta: string): string[] {
  const r: string[] = [];
  let c = new Date(`${desde}T00:00:00`);
  const e = new Date(`${hasta}T00:00:00`);
  while (c <= e) {
    r.push(c.toISOString().slice(0, 10));
    c.setDate(c.getDate() + 1);
  }
  return r;
}
function hoyStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TecnicoPage() {
  const { usuario, listo, salir } = useSesion('tecnico');
  const toast = useToast();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<'inicio' | 'historial'>('inicio');
  const [subTabHistorial, setSubTabHistorial] = useState<TabHistorial>('lista');
  const [filtroTipo, setFiltroTipo] = useState<TipoMovimiento | 'todos'>('todos');
  const [modal, setModal] = useState<ModalAbierto>(null);

  useEffect(() => {
    if (listo) cargarTodo();
  }, [listo]);

  async function cargarTodo() {
    if (!usuario) return;
    setCargando(true);
    try {
      const [saldoRes, movRes] = await Promise.all([
        movimientosApi.saldo(usuario.sub),
        movimientosApi.mios(),
      ]);
      setSaldo(saldoRes.saldo);
      setMovimientos(movRes);
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setCargando(false);
    }
  }

  const movimientosFiltrados = useMemo(
    () => (filtroTipo === 'todos' ? movimientos : movimientos.filter((m) => m.tipo === filtroTipo)),
    [movimientos, filtroTipo],
  );

  if (!listo || !usuario) return null;

  return (
    <>
      <SessionHeader usuario={usuario} onSalir={salir} />
      <main className="sp">
        <div className="tabs">
          <button className={`tab ${tab === 'inicio' ? 'on' : ''}`} onClick={() => setTab('inicio')}>Inicio</button>
          <button className={`tab ${tab === 'historial' ? 'on' : ''}`} onClick={() => setTab('historial')}>Historial</button>
        </div>

        {tab === 'inicio' && (
          <>
            <div className="card">
              <div className="saldo-block">
                <div className={`saldo-num ${(saldo ?? 0) < 0 ? 'neg' : 'pos'}`}>
                  {cargando ? '—' : saldo}
                </div>
                <div className="saldo-lbl">Francos disponibles</div>
              </div>
              {!cargando && (saldo ?? 0) <= 0 && (
                <div className="saldo-warn">No tenés saldo de francos disponible por el momento.</div>
              )}
            </div>

            <div className="btn-grid">
              <button className="btn btn-sec" onClick={() => setModal('generado')}>Declarar franco</button>
              <button className="btn btn-sec" onClick={() => setModal('consumido')}>Pedir franco</button>
              <button className="btn btn-sec" onClick={() => setModal('guardia')}>Registrar guardia</button>
            </div>

            <div className="div-t">Últimos movimientos</div>
            {cargando ? (
              <div className="lw"><div className="spinr" /></div>
            ) : movimientos.length === 0 ? (
              <div className="empty">Todavía no registraste ningún movimiento.</div>
            ) : (
              movimientos.slice(0, 5).map((m) => <MovimientoCard key={m.id} movimiento={m} />)
            )}
          </>
        )}

        {tab === 'historial' && (
          <>
            <HistorialFiltros tipo={filtroTipo} onTipo={setFiltroTipo} />
            <div className="cal-sub">
              <button className={`cal-sub-btn ${subTabHistorial === 'lista' ? 'on' : ''}`} onClick={() => setSubTabHistorial('lista')}>Lista</button>
              <button className={`cal-sub-btn ${subTabHistorial === 'calendario' ? 'on' : ''}`} onClick={() => setSubTabHistorial('calendario')}>Calendario</button>
            </div>
            {cargando ? (
              <div className="lw"><div className="spinr" /></div>
            ) : subTabHistorial === 'calendario' ? (
              <Calendar movimientos={movimientosFiltrados} />
            ) : movimientosFiltrados.length === 0 ? (
              <div className="empty">Todavía no registraste ningún movimiento.</div>
            ) : (
              movimientosFiltrados.map((m) => <MovimientoCard key={m.id} movimiento={m} />)
            )}
          </>
        )}
      </main>

      {modal === 'generado' && (
        <ModalDeclararGenerado
          onClose={() => setModal(null)}
          onListo={() => { setModal(null); cargarTodo(); }}
        />
      )}
      {modal === 'consumido' && (
        <ModalSolicitarConsumido
          saldo={saldo ?? 0}
          onClose={() => setModal(null)}
          onListo={() => { setModal(null); cargarTodo(); }}
        />
      )}
      {modal === 'guardia' && (
        <ModalRegistrarGuardia
          onClose={() => setModal(null)}
          onListo={() => { setModal(null); cargarTodo(); }}
        />
      )}
    </>
  );
}

// ─── Declarar franco generado: solo sabado (0.5) o domingo (1) ───

function ModalDeclararGenerado({ onClose, onListo }: { onClose: () => void; onListo: () => void }) {
  const toast = useToast();
  const [fecha, setFecha] = useState('');
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const dow = fecha ? diaSemana(fecha) : null;
  const valido = dow === 0 || dow === 6;
  const cantidad = dow === 6 ? 0.5 : dow === 0 ? 1 : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valido) { toast('La fecha tiene que ser sábado o domingo.', 'e'); return; }
    setEnviando(true);
    try {
      await movimientosApi.declararGenerado({ fechaTrabajo: fecha, comentario: comentario || undefined });
      toast('Franco generado declarado. Queda pendiente de aprobación.', 's');
      onListo();
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Declarar franco generado" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="f">
          <label>Fecha del día libre trabajado</label>
          <input type="date" required max={hoyStr()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          {fecha && !valido && <div className="hint" style={{ color: 'var(--red)' }}>Solo se pueden declarar sábados o domingos.</div>}
          {fecha && valido && <div className="hint">{DS[dow!]} · genera {cantidad === 0.5 ? 'medio franco (0,5)' : 'un franco entero (1)'}</div>}
        </div>
        <div className="f">
          <label>Comentario (opcional)</label>
          <textarea rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </div>
        <button className="btn btn-pri" type="submit" disabled={enviando || !valido}>Enviar</button>
      </form>
    </Modal>
  );
}

// ─── Pedir franco: cantidad (multiplos de 0.5) -> N fechas, con posible medio franco ───

function ModalSolicitarConsumido({ saldo, onClose, onListo }: { saldo: number; onClose: () => void; onListo: () => void }) {
  const toast = useToast();
  const [cantidad, setCantidad] = useState(1);
  const [fechas, setFechas] = useState<FechaSolicitada[]>([{ fecha: '', esMedio: false, turno: null }]);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const diasEsperados = Math.ceil(cantidad);
  const tieneMedio = Math.round(cantidad * 10) % 10 === 5;

  useEffect(() => {
    setFechas((prev) => {
      const nuevo = [...prev];
      while (nuevo.length < diasEsperados) nuevo.push({ fecha: '', esMedio: false, turno: null });
      while (nuevo.length > diasEsperados) nuevo.pop();
      if (!tieneMedio) nuevo.forEach((f) => { f.esMedio = false; f.turno = null; });
      return nuevo;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diasEsperados, tieneMedio]);

  function setFecha(i: number, fecha: string) {
    setFechas((prev) => prev.map((f, idx) => (idx === i ? { ...f, fecha } : f)));
  }
  function marcarMedio(i: number) {
    setFechas((prev) => prev.map((f, idx) => ({ ...f, esMedio: idx === i, turno: idx === i ? (f.turno || 'man') : null })));
  }
  function setTurnoMedio(i: number, turno: Turno) {
    setFechas((prev) => prev.map((f, idx) => (idx === i ? { ...f, turno } : f)));
  }

  const huboFinde = fechas.some((f) => f.fecha && esFinDeSemana(f.fecha));
  const faltanFechas = fechas.some((f) => !f.fecha);
  const faltaElegirMedio = tieneMedio && !fechas.some((f) => f.esMedio);
  const excedeSaldo = cantidad > saldo;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (huboFinde) { toast('No se pueden pedir francos sábado ni domingo.', 'e'); return; }
    if (faltaElegirMedio) { toast('Indicá cuál de los días es el medio franco.', 'e'); return; }
    setEnviando(true);
    try {
      await movimientosApi.solicitarConsumido({ cantidad, fechas, comentario: comentario || undefined });
      toast('Pedido de franco enviado. Queda pendiente de aprobación.', 's');
      onListo();
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Pedir franco" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="f">
          <label>Cantidad de francos</label>
          <input
            type="number" step={0.5} min={0.5} required
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(0.5, Number(e.target.value)))}
          />
          {excedeSaldo && <div className="hint" style={{ color: 'var(--red)' }}>Tu saldo actual es {saldo}. Podés igual enviar el pedido, pero puede que no te lo aprueben.</div>}
        </div>

        <div className="fdias-wrap">
          {fechas.map((f, i) => (
            <div className="fdia-row" key={i}>
              <div className="fdia-label">Día {i + 1} de {diasEsperados}{f.esMedio ? ' · medio franco' : ''}</div>
              <input
                type="date" required min={hoyStr()}
                value={f.fecha}
                onChange={(e) => setFecha(i, e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #D8D2C4', fontSize: 15 }}
              />
              {f.fecha && esFinDeSemana(f.fecha) && (
                <div className="hint" style={{ color: 'var(--red)' }}>No se pueden pedir francos sábado ni domingo.</div>
              )}
              {tieneMedio && (
                <div style={{ marginTop: 7, display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="gd-chk">
                    <input type="checkbox" checked={f.esMedio} onChange={() => marcarMedio(i)} />
                    Este es el medio franco
                  </label>
                  {f.esMedio && (
                    <select value={f.turno || 'man'} onChange={(e) => setTurnoMedio(i, e.target.value as Turno)} style={{ padding: '6px 9px', borderRadius: 6, border: '1.5px solid #D8D2C4' }}>
                      <option value="man">Mañana</option>
                      <option value="tar">Tarde</option>
                    </select>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="f">
          <label>Comentario (opcional)</label>
          <textarea rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </div>
        <button className="btn btn-pri" type="submit" disabled={enviando || faltanFechas || huboFinde || faltaElegirMedio}>
          Enviar pedido
        </button>
      </form>
    </Modal>
  );
}

// ─── Registrar guardia: periodo de hasta 7 dias, detalle dia por dia ───

function ModalRegistrarGuardia({ onClose, onListo }: { onClose: () => void; onListo: () => void }) {
  const toast = useToast();
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [dias, setDias] = useState<DiaGuardia[]>([]);
  const [novedades, setNovedades] = useState('');
  const [enviando, setEnviando] = useState(false);

  const periodo = useMemo(() => (desde && hasta && hasta >= desde ? fechasEnRango(desde, hasta) : []), [desde, hasta]);
  const excedePeriodo = periodo.length > 7;
  const periodoKey = periodo.join(',');

  useEffect(() => {
    setDias((prev) => {
      const mapaPrevio = new Map(prev.map((d) => [d.fecha, d]));
      return periodo.map((fecha) => mapaPrevio.get(fecha) || { fecha, convocado: false, inicio: null, fin: null });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoKey]);

  function toggleConvocado(fecha: string) {
    setDias((prev) => prev.map((d) => (d.fecha === fecha ? { ...d, convocado: !d.convocado, inicio: d.inicio || '20:00', fin: d.fin || '08:00' } : d)));
  }
  function setHorario(fecha: string, campo: 'inicio' | 'fin', valor: string) {
    setDias((prev) => prev.map((d) => (d.fecha === fecha ? { ...d, [campo]: valor } : d)));
  }

  const faltaHorario = dias.some((d) => d.convocado && (!d.inicio || !d.fin));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!periodo.length) { toast('Elegí un período válido.', 'e'); return; }
    if (excedePeriodo) { toast('El período máximo de una guardia es de 7 días.', 'e'); return; }
    if (faltaHorario) { toast('Completá el horario de los días convocados.', 'e'); return; }
    setEnviando(true);
    try {
      await movimientosApi.registrarGuardia({ guardiaDesde: desde, guardiaHasta: hasta, guardiaDias: dias, guardiaNovedades: novedades || undefined });
      toast('Guardia registrada. Queda pendiente de aprobación.', 's');
      onListo();
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Registrar guardia pasiva" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="f-row">
          <div className="f">
            <label>Desde</label>
            <input type="date" required value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="f">
            <label>Hasta</label>
            <input type="date" required value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
        {excedePeriodo && <div className="al al-warn">El período máximo de una guardia es de 7 días.</div>}

        {dias.length > 0 && !excedePeriodo && (
          <div className="fdias-wrap" style={{ marginBottom: 13 }}>
            {dias.map((d) => (
              <div className="gd-row" key={d.fecha}>
                <div className="gd-top">
                  <span className="gd-lbl">{DS[diaSemana(d.fecha)]} {fmt(d.fecha)}</span>
                  <label className="gd-chk">
                    <input type="checkbox" checked={d.convocado} onChange={() => toggleConvocado(d.fecha)} />
                    Convocado
                  </label>
                </div>
                {d.convocado && (
                  <div className="gd-times">
                    <input type="time" value={d.inicio || ''} onChange={(e) => setHorario(d.fecha, 'inicio', e.target.value)} required />
                    <span>a</span>
                    <input type="time" value={d.fin || ''} onChange={(e) => setHorario(d.fecha, 'fin', e.target.value)} required />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="f">
          <label>Novedades (opcional)</label>
          <textarea rows={2} value={novedades} onChange={(e) => setNovedades(e.target.value)} />
        </div>
        <button className="btn btn-pri" type="submit" disabled={enviando || !periodo.length || excedePeriodo || faltaHorario}>
          Registrar
        </button>
      </form>
    </Modal>
  );
}

function fmt(d: string) {
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}
