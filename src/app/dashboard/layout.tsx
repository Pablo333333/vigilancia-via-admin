'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard/mapa':         { title: 'Mapa de Incidentes',   subtitle: 'Vista geográfica de todos los reportes activos' },
  '/dashboard/reportes':     { title: 'Reportes',             subtitle: 'Gestión y seguimiento de incidentes viales' },
  '/dashboard/estadisticas': { title: 'Estadísticas',         subtitle: 'Análisis de rendimiento y puntos críticos' },
  '/dashboard/comunicados':  { title: 'Comunicados',          subtitle: 'Alertas y avisos para la app móvil' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();

  const meta = PAGE_META[pathname] ?? { title: 'Panel Admin', subtitle: '' };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={user} onLogout={logout} />

      <div className="pl-64 flex flex-col min-h-screen">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
