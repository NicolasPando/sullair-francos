'use client';

import { ReactNode } from 'react';

export default function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="ov" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="mcr">
          <h3>{titulo}</h3>
          <button className="mcls" onClick={onClose}>&#215;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
