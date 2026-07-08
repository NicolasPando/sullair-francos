'use client';

import { useEffect, useState } from 'react';
import { useSesion } from '@/lib/useSesion';
import { movimientosApi } from '@/lib/api';
import { Movimiento } from '@/lib/types';
import { useToast } from '@/components/Toast';
import SessionHeader from '@/components/SessionHeader';
import MovimientoCard from '@/components/MovimientoCard';

export default function EncargadoPage() {
  const { usuario, listo, salir } = useSesion('encargado');
  const toast = useToast();
  const [tab, setTab] = useState<'pendientes' | 'historial'>('pendientes');
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [rechazando, setRechazando] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => {
    if (listo) cargar();
  }, [listo, tab]);

  async function cargar() {
    setCargando(true);
    try {
      const data = await movimientosApi.deMiSector(tab === 'pendientes' ? 'pendiente' : undefined);
      setMovimientos(tab === 'pendientes' ? data : data.filter((m) => m.estado !== 'pendiente'));
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setCargando(false);
    }
  }

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

  if (!listo || !usuario) return null;

  return (
    <>
      <SessionHeader usuario={usuario} onSalir={salir} />
      <main className="sp">
        <div className="tabs">
          <button className={`tab ${tab === 'pendientes' ? 'on' : ''}`} onClick={() => setTab('pendientes')}>Pendientes</button>
          <button className={`tab ${tab === 'historial' ? 'on' : ''}`} onClick={() => setTab('historial')}>Historial</button>
        </div>

        {cargando ? (
          <div className="lw"><div className="spinr" /></div>
        ) : movimientos.length === 0 ? (
          <div className="empty">{tab === 'pendientes' ? 'No hay movimientos pendientes en tu sector.' : 'Sin movimientos resueltos todavía.'}</div>
        ) : (
          movimientos.map((m) => (
            <MovimientoCard
              key={m.id}
              movimiento={m}
              mostrarTecnico
              acciones={
                tab === 'pendientes' ? (
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
                ) : undefined
              }
            />
          ))
        )}
      </main>
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
