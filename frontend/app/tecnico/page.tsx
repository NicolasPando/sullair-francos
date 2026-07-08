'use client';

import { useEffect, useState } from 'react';
import { useSesion } from '@/lib/useSesion';
import { movimientosApi } from '@/lib/api';
import { Movimiento } from '@/lib/types';
import { useToast } from '@/components/Toast';
import SessionHeader from '@/components/SessionHeader';
import MovimientoCard from '@/components/MovimientoCard';
import Modal from '@/components/Modal';

type ModalAbierto = null | 'generado' | 'consumido' | 'guardia';

export default function TecnicoPage() {
  const { usuario, listo, salir } = useSesion('tecnico');
  const toast = useToast();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState<ModalAbierto>(null);
  const [enviando, setEnviando] = useState(false);

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

  async function onDeclararGenerado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    try {
      await movimientosApi.declararGenerado({
        fechaTrabajo: String(f.get('fechaTrabajo')),
        diaTrabajado: String(f.get('diaTrabajado') || ''),
        comentario: String(f.get('comentario') || ''),
      });
      toast('Franco generado declarado. Queda pendiente de aprobación.', 's');
      setModal(null);
      cargarTodo();
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setEnviando(false);
    }
  }

  async function onSolicitarConsumido(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ((saldo ?? 0) < 1) { toast('No tenés saldo disponible para pedir un franco.', 'e'); return; }
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    try {
      await movimientosApi.solicitarConsumido({
        fechaDeseada: String(f.get('fechaDeseada')),
        turno: String(f.get('turno') || ''),
        comentario: String(f.get('comentario') || ''),
      });
      toast('Pedido de franco enviado. Queda pendiente de aprobación.', 's');
      setModal(null);
      cargarTodo();
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setEnviando(false);
    }
  }

  async function onRegistrarGuardia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    try {
      await movimientosApi.registrarGuardia({
        guardiaDesde: String(f.get('guardiaDesde')),
        guardiaHasta: String(f.get('guardiaHasta')),
        cantidad: Number(f.get('cantidad') || 0),
        guardiaNovedades: String(f.get('guardiaNovedades') || ''),
      });
      toast('Guardia registrada. Queda pendiente de aprobación.', 's');
      setModal(null);
      cargarTodo();
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setEnviando(false);
    }
  }

  if (!listo || !usuario) return null;

  return (
    <>
      <SessionHeader usuario={usuario} onSalir={salir} />
      <main className="sp">
        <div className="card">
          <div className="saldo-block">
            <div className={`saldo-num ${(saldo ?? 0) < 0 ? 'neg' : 'pos'}`}>
              {cargando ? '—' : (saldo ?? 0)}
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

        <div className="div-t">Historial</div>
        {cargando ? (
          <div className="lw"><div className="spinr" /></div>
        ) : movimientos.length === 0 ? (
          <div className="empty">Todavía no registraste ningún movimiento.</div>
        ) : (
          movimientos.map((m) => <MovimientoCard key={m.id} movimiento={m} />)
        )}
      </main>

      {modal === 'generado' && (
        <Modal titulo="Declarar franco generado" onClose={() => setModal(null)}>
          <form onSubmit={onDeclararGenerado}>
            <div className="f">
              <label>Fecha del día libre trabajado</label>
              <input name="fechaTrabajo" type="date" required />
            </div>
            <div className="f">
              <label>Día (opcional)</label>
              <input name="diaTrabajado" type="text" placeholder="Ej: Sábado" />
            </div>
            <div className="f">
              <label>Comentario (opcional)</label>
              <textarea name="comentario" rows={2} />
            </div>
            <button className="btn btn-pri" type="submit" disabled={enviando}>Enviar</button>
          </form>
        </Modal>
      )}

      {modal === 'consumido' && (
        <Modal titulo="Pedir un franco" onClose={() => setModal(null)}>
          <form onSubmit={onSolicitarConsumido}>
            <div className="f">
              <label>Fecha deseada</label>
              <input name="fechaDeseada" type="date" required />
            </div>
            <div className="f">
              <label>Turno (opcional)</label>
              <input name="turno" type="text" placeholder="Ej: Mañana" />
            </div>
            <div className="f">
              <label>Comentario (opcional)</label>
              <textarea name="comentario" rows={2} />
            </div>
            <button className="btn btn-pri" type="submit" disabled={enviando}>Enviar pedido</button>
          </form>
        </Modal>
      )}

      {modal === 'guardia' && (
        <Modal titulo="Registrar guardia pasiva" onClose={() => setModal(null)}>
          <form onSubmit={onRegistrarGuardia}>
            <div className="f-row">
              <div className="f">
                <label>Desde</label>
                <input name="guardiaDesde" type="date" required />
              </div>
              <div className="f">
                <label>Hasta</label>
                <input name="guardiaHasta" type="date" required />
              </div>
            </div>
            <div className="f">
              <label>Francos que genera</label>
              <input name="cantidad" type="number" step="0.5" min="0" defaultValue="1" required />
            </div>
            <div className="f">
              <label>Novedades (opcional)</label>
              <textarea name="guardiaNovedades" rows={2} />
            </div>
            <button className="btn btn-pri" type="submit" disabled={enviando}>Registrar</button>
          </form>
        </Modal>
      )}
    </>
  );
}
