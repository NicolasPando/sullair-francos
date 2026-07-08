import type { Metadata } from 'next';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sullair · Francos y Guardias',
  description: 'Gestión de francos y guardias pasivas — Sullair Argentina',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <div className="app-shell">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
