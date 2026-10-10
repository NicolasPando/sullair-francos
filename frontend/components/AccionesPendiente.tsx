'use client';

import { useState } from 'react';

// Botones Aprobar / Rechazar (con motivo) para un movimiento pendiente.
// Lo usan el encargado y el administrador. onAprobar/onRechazar hacen la llamada y recargan.
export default function AccionesPendiente({
  onAprobar,
  onRechazar,
}: {
  onAprobar: () => Promise<void>;
  onRechazar: (motivo: string) => Promise<void>;
}) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);

  async function correr(fn: () => Promise<void>) {
    setProcesando(true);
    try { await fn(); } finally { setProcesando(false); }
  }

  if (rechazando) {
    return (
      <div className="rej-form" style={{ width: '100%' }}>
        <div className="f">
          <label>Motivo del rechazo</label>
          <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <div className="btn-row">
          <button className="btn btn-ghost btn-sm" onClick={() => setRechazando(false)}>Cancelar</button>
          <button className="btn btn-danger btn-sm" disabled={procesando || !motivo.trim()} onClick={() => correr(() => onRechazar(motivo))}>
            Confirmar rechazo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="btn-row" style={{ width: '100%' }}>
      <button className="btn btn-ok btn-sm" disabled={procesando} onClick={() => correr(onAprobar)}>Aprobar</button>
      <button className="btn btn-danger btn-sm" disabled={procesando} onClick={() => setRechazando(true)}>Rechazar</button>
    </div>
  );
}
