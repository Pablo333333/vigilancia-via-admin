'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReportsAPI } from '@/lib/api';
import type { Reporte } from '@/lib/types';
import { ESTADO_LABELS, TIPO_LABELS, TIPOS } from '@/lib/types';
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

export default function EstadisticasPage() {
  const [reports, setReports] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(() => {
    setLoading(true);
    ReportsAPI.getAll()
      .then(({ data }) => setReports(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  // ─── KPIs ────────────────────────────────────────────────────────────────────
  const total       = reports.length;
  const pendientes  = reports.filter((r) => r.estado === 'PENDIENTE').length;
  const enProceso   = reports.filter((r) => r.estado === 'EN_PROCESO').length;
  const solucionados = reports.filter((r) => r.estado === 'SOLUCIONADO').length;

  // ─── Por tipo de problema ─────────────────────────────────────────────────
  const byTipo = TIPOS.map((tipo) => ({
    tipo: TIPO_LABELS[tipo].replace('en la vía', 'en vía').replace('Deficiente ', '').replace('Mucho tiempo de', 'T. de'),
    total: reports.filter((r) => r.tipoProblema === tipo).length,
  })).sort((a, b) => b.total - a.total);

  // ─── Por estado (pie) ──────────────────────────────────────────────────────
  const byEstadoRaw = [
    { name: ESTADO_LABELS.PENDIENTE,   value: pendientes },
    { name: ESTADO_LABELS.EN_PROCESO,  value: enProceso },
    { name: ESTADO_LABELS.SOLUCIONADO, value: solucionados },
  ].filter((s) => s.value > 0);

  // Asegurar que la suma de porcentajes sea exactamente 100%
  const sum = byEstadoRaw.reduce((acc, curr) => acc + curr.value, 0);
  let byEstado = byEstadoRaw.map(item => ({
    ...item,
    percentage: sum > 0 ? Math.floor((item.value / sum) * 100) : 0
  }));

  if (sum > 0) {
    const currentSum = byEstado.reduce((acc, curr) => acc + curr.percentage, 0);
    const diff = 100 - currentSum;
    if (diff > 0) {
      // Asignar la diferencia al valor más alto para redondear a 100%
      let maxIdx = 0;
      for (let i = 1; i < byEstado.length; i++) {
        if (byEstado[i].value > byEstado[maxIdx].value) maxIdx = i;
      }
      byEstado[maxIdx].percentage += diff;
    }
  }

  // Usar el valor en el nombre para mostrarlo en la leyenda (según pedido: "Pendientes: 7")
  byEstado = byEstado.map(item => ({
    ...item,
    displayName: `${item.name}: ${item.value}`
  }));

  // ─── Tendencia diaria (últimos 14 días) ───────────────────────────────────
  const dailyTrend = Array.from({ length: 14 }, (_, i) => {
    const day   = subDays(new Date(), 13 - i);
    const label = format(day, 'dd/MM', { locale: es });
    const ymd   = format(day, 'yyyy-MM-dd');
    return {
      fecha: label,
      total: reports.filter((r) => r.fechaCreacion.startsWith(ymd)).length,
    };
  });

  // ─── Puntos críticos (top 5 tipos con más reportes pendientes/en proceso) ──
  const criticalTypes = TIPOS
    .map((tipo) => ({
      tipo:     TIPO_LABELS[tipo],
      abiertos: reports.filter((r) => r.tipoProblema === tipo && r.estado !== 'SOLUCIONADO').length,
      total:    reports.filter((r) => r.tipoProblema === tipo).length,
    }))
    .filter((t) => t.total > 0)
    .sort((a, b) => b.abiertos - a.abiertos)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard Icon={FileText}     color="blue"   label="Total reportes"       value={total} />
        <KpiCard Icon={AlertTriangle} color="red"    label="Pendientes"           value={pendientes} />
        <KpiCard Icon={Clock}        color="amber"  label="En proceso"           value={enProceso} />
        <KpiCard Icon={CheckCircle2} color="green"  label="Solucionados"         value={solucionados} />
      </div>

      {/* ─── Gráficos fila 1 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* BarChart: por tipo */}
        <div className="card p-5 lg:col-span-2">
          <p className="section-title mb-4">Reportes por tipo de problema</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byTipo} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="tipo" width={130} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="total" name="Reportes" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PieChart: por estado */}
        <div className="card p-5 flex flex-col">
          <p className="section-title mb-4">Distribución por estado</p>
          {byEstado.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="percentage"
                    nameKey="displayName"
                  >
                    {byEstado.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Sin datos
            </div>
          )}
        </div>
      </div>

      {/* ─── Gráficos fila 2 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LineChart: tendencia */}
        <div className="card p-5 lg:col-span-2">
          <p className="section-title mb-4">Tendencia diaria — últimos 14 días</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyTrend} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Line
                type="monotone"
                dataKey="total"
                name="Reportes"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla: puntos críticos */}
        <div className="card p-5 flex flex-col">
          <p className="section-title mb-4">Puntos críticos</p>
          <div className="space-y-3 flex-1">
            {criticalTypes.length > 0 ? criticalTypes.map((ct, i) => (
              <div key={ct.tipo} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{ct.tipo}</p>
                  <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${Math.min(100, (ct.total / Math.max(...criticalTypes.map(c => c.total))) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 shrink-0">
                  <span className="font-semibold text-red-600">{ct.abiertos}</span>/{ct.total}
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Sin datos</p>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Abiertos / Total por tipo
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  Icon, color, label, value,
}: {
  Icon: React.ElementType;
  color: 'blue' | 'red' | 'amber' | 'green';
  label: string;
  value: string | number;
}) {
  const colors = {
    blue:  { bg: 'bg-blue-50',   icon: 'text-blue-600',  iconBg: 'bg-blue-100'  },
    red:   { bg: 'bg-red-50',    icon: 'text-red-600',   iconBg: 'bg-red-100'   },
    amber: { bg: 'bg-amber-50',  icon: 'text-amber-600', iconBg: 'bg-amber-100' },
    green: { bg: 'bg-green-50',  icon: 'text-green-600', iconBg: 'bg-green-100' },
  }[color];

  return (
    <div className={`card p-5 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <div className={`h-9 w-9 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
