'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReportsAPI } from '@/lib/api';
import type { EstadoReporte, Reporte, TipoProblema } from '@/lib/types';
import { ESTADOS, ESTADO_LABELS, ESTADO_STYLES, TIPO_LABELS, TIPOS } from '@/lib/types';
import ReportDetailModal from '@/components/reports/ReportDetailModal';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, Filter, Search, X } from 'lucide-react';
import clsx from 'clsx';

interface Filtros {
  estado: EstadoReporte | '';
  tipo: TipoProblema | '';
  fechaDesde: string;
  fechaHasta: string;
  busqueda: string;
}

const FILTROS_INIT: Filtros = { estado: '', tipo: '', fechaDesde: '', fechaHasta: '', busqueda: '' };

export default function ReportesPage() {
  const [reports, setReports]       = useState<Reporte[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filtros, setFiltros]       = useState<Filtros>(FILTROS_INIT);
  const [selected, setSelected]     = useState<Reporte | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadReports = useCallback(() => {
    setLoading(true);
    setError(null);
    ReportsAPI.getAll()
      .then(({ data }) => setReports(data))
      .catch(() => setError('No se pudieron cargar los reportes.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleStatusUpdate = async (id: string, estado: EstadoReporte, comentario?: string) => {
    await ReportsAPI.updateStatus(id, estado, comentario);
    // Actualización optimista inmediata
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, estado, comentarioResolucion: comentario ?? r.comentarioResolucion } : r));
    // Refresco completo desde el servidor en segundo plano
    loadReports();
  };

  // ─── Filtrado ────────────────────────────────────────────────────────────────
  const filtered = reports.filter((r) => {
    if (filtros.estado && r.estado !== filtros.estado) return false;
    if (filtros.tipo   && r.tipoProblema !== filtros.tipo) return false;
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      if (
        !r.tipoProblema.toLowerCase().includes(q) &&
        !r.reportante?.email.toLowerCase().includes(q) &&
        !r.comentario?.toLowerCase().includes(q)
      ) return false;
    }
    if (filtros.fechaDesde) {
      const desde = startOfDay(parseISO(filtros.fechaDesde));
      if (isBefore(parseISO(r.fechaCreacion), desde)) return false;
    }
    if (filtros.fechaHasta) {
      const hasta = endOfDay(parseISO(filtros.fechaHasta));
      if (isAfter(parseISO(r.fechaCreacion), hasta)) return false;
    }
    return true;
  });

  const activeFilters = Object.values(filtros).some(Boolean);

  return (
    <div className="space-y-4">
      {/* ─── Barra de herramientas ──────────────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Búsqueda libre */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Buscar por tipo, email, comentario…"
              value={filtros.busqueda}
              onChange={(e) => setFiltros((f) => ({ ...f, busqueda: e.target.value }))}
            />
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={clsx('btn-secondary', showFilters && 'bg-primary-50 text-primary-700 border-primary-200')}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilters && <span className="h-2 w-2 rounded-full bg-primary-500 ml-0.5" />}
          </button>

          {activeFilters && (
            <button
              onClick={() => setFiltros(FILTROS_INIT)}
              className="btn-secondary text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          )}

          <button onClick={loadReports} className="btn-secondary ml-auto">
            Actualizar
          </button>
        </div>

        {/* Filtros expandibles */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            {/* Estado */}
            <div>
              <label className="label mb-1 block">Estado</label>
              <div className="relative">
                <select
                  className="input-field appearance-none pr-8"
                  value={filtros.estado}
                  onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value as EstadoReporte | '' }))}
                >
                  <option value="">Todos</option>
                  {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="label mb-1 block">Tipo de problema</label>
              <div className="relative">
                <select
                  className="input-field appearance-none pr-8"
                  value={filtros.tipo}
                  onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value as TipoProblema | '' }))}
                >
                  <option value="">Todos</option>
                  {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Desde */}
            <div>
              <label className="label mb-1 block">Fecha desde</label>
              <input
                type="date"
                className="input-field"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros((f) => ({ ...f, fechaDesde: e.target.value }))}
              />
            </div>

            {/* Hasta */}
            <div>
              <label className="label mb-1 block">Fecha hasta</label>
              <input
                type="date"
                className="input-field"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros((f) => ({ ...f, fechaHasta: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Contador ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading ? 'Cargando…' : `${filtered.length} reporte${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
          {activeFilters && ` (de ${reports.length} totales)`}
        </p>
      </div>

      {/* ─── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button onClick={loadReports} className="btn-secondary mt-3">Reintentar</button>
          </div>
        ) : loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="font-medium">No hay reportes que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Fecha', 'Tipo de problema', 'Estado', 'Reportante', 'Coordenadas', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {format(parseISO(r.fechaCreacion), 'dd/MM/yy HH:mm', { locale: es })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {TIPO_LABELS[r.tipoProblema]}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', ESTADO_STYLES[r.estado])}>
                        {ESTADO_LABELS[r.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">
                      {r.reportante?.email ?? r.reportanteId.slice(0, 8) + '…'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {r.latitud.toFixed(4)}, {r.longitud.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-primary-600 hover:text-primary-800 font-medium text-xs">
                        Ver detalle →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal de detalle ──────────────────────────────────────────────── */}
      {selected && (
        <ReportDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
