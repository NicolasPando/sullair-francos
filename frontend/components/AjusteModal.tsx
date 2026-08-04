'use client';

import { useState } from 'react';
import { movimientosApi } from '@/lib/api';
import { useToast } from '@/components/Toast';
import Modal from './Modal';

export default function AjusteModal({
  tecnicoId,
  tecnicoNombre,
  onClose,
  onListo,
}: {
  tecnicoId: string;
  tecnicoNombre: string;
  onClose: () => void;
  onListo: () => void;
}) {
  const toast = useToast();
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    try {
      await movimientosApi.ajuste({
        tecnicoId,
        cantidad: Number(f.get('cantidad')),
        motivoAjuste: String(f.get('motivoAjuste')),
      });
      toast('Ajuste aplicado.', 's');
      onListo();
    } catch (err: any) {
      toast(err.message, 'e');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Ajustar saldo — ${tecnicoNombre}`} onClose={onClose}>
      <form onSubmit={onSubmit}>
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
  );
}
