'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { ReportsAPI } from '@/lib/api';
import type { Reporte } from '@/lib/types';
import { ESTADO_LABELS, ESTADO_STYLES } from '@/lib/types';
import clsx from 'clsx';

const IncidentMap = dynamic(() => import('@/components/map/IncidentMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-100 rounded-xl">
      <div className="text-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Cargando mapa…</p>
      </div>
    </div>
  ),
});

export default function MapaPage() {
  const [reports, setReports] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'ALL' | 'PENDIENTE' | 'EN_PROCESO' | 'SOLUCIONADO'>('ALL');

  const loadReports = useCallback(() => {
    setLoading(true);
    ReportsAPI.getAll()
      .then(({ data }) => setReports(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const visible = filter === 'ALL' ? reports : reports.filter((r) => r.estado === filter);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)]">
      {/* Toolbar */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700 mr-1">Mostrar:</span>
        {(['ALL', 'PENDIENTE', 'EN_PROCESO', 'SOLUCIONADO'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              filter === s
                ? s === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : clsx(ESTADO_STYLES[s as keyof typeof ESTADO_STYLES], 'ring-2 ring-offset-1 ring-current')
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {s === 'ALL' ? 'Todos' : ESTADO_LABELS[s]}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          {loading ? 'Actualizando…' : `${visible.length} incidente${visible.length !== 1 ? 's' : ''} visible${visible.length !== 1 ? 's' : ''}`}
        </span>
        <button onClick={loadReports} className="btn-secondary text-xs px-2.5 py-1.5">
          Actualizar
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 card overflow-hidden">
        <IncidentMap reports={visible} />
      </div>

      {/* Legend */}
      <div className="card p-3 flex flex-wrap gap-4 text-xs font-medium">
        {[
          { color: 'bg-red-500',   label: 'Pendiente' },
          { color: 'bg-amber-500', label: 'En proceso' },
          { color: 'bg-green-500', label: 'Solucionado' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${color}`} />
            <span className="text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
