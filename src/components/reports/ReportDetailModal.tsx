'use client';

import { AxiosError } from 'axios';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  ESTADO_LABELS,
  ESTADO_STYLES,
  ESTADOS,
  TIPO_LABELS,
  type EstadoReporte,
  type Reporte,
} from '@/lib/types';

interface Props {
  report: Reporte;
  onClose: () => void;
  onStatusUpdate: (id: string, estado: EstadoReporte, comentario?: string) => Promise<void>;
}

export default function ReportDetailModal({ report, onClose, onStatusUpdate }: Props) {
  const [newEstado, setNewEstado]       = useState<EstadoReporte>(report.estado);
  const [comentario, setComentario]     = useState(report.comentarioResolucion ?? '');
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState<string | null>(null);

  const hasChanges = newEstado !== report.estado;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onStatusUpdate(report.id, newEstado, comentario || undefined);
      toast.success(`Estado actualizado a "${ESTADO_LABELS[newEstado]}"`);
      onClose();
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.message : undefined;
      const errorText = Array.isArray(msg) ? msg.join(' · ') : msg ?? 'Error al actualizar el estado.';
      setSaveError(errorText);
      toast.error(errorText);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{TIPO_LABELS[report.tipoProblema]}</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{report.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Estado actual">
              <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', ESTADO_STYLES[report.estado])}>
                {ESTADO_LABELS[report.estado]}
              </span>
            </InfoRow>

            <InfoRow label="Fecha de reporte">
              {format(parseISO(report.fechaCreacion), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
            </InfoRow>

            <InfoRow label="Reportado por">
              {report.reportante?.email ?? (report.reportanteId ? report.reportanteId : 'Anónimo')}
            </InfoRow>

            <InfoRow label="Ubicación">
              <span className="text-slate-500 text-sm">
                Referenciada por GPS
              </span>
            </InfoRow>

            {report.comentario && (
              <InfoRow label="Comentario del usuario" className="col-span-2">
                <em className="text-slate-600">&ldquo;{report.comentario}&rdquo;</em>
              </InfoRow>
            )}

            {report.sincronizadoEn && (
              <InfoRow label="Sincronizado (offline)" className="col-span-2">
                {format(parseISO(report.sincronizadoEn), "dd MMM yyyy HH:mm", { locale: es })}
                <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Offline</span>
              </InfoRow>
            )}
          </div>

          {/* Foto */}
          {report.fotoUrl && (
            <div>
              <p className="label mb-2">Foto del incidente</p>
              <div className="relative">
                <img
                  src={report.fotoUrl}
                  alt="Foto del incidente"
                  className="rounded-xl w-full max-h-56 object-cover border border-slate-200"
                />
                <a
                  href={report.fotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 rounded-lg bg-white/90 p-1.5 text-slate-600 hover:text-primary-600 shadow"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {/* Resolución existente */}
          {report.comentarioResolucion && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="label text-green-700 mb-1">Comentario de resolución</p>
              <p className="text-sm text-green-800">{report.comentarioResolucion}</p>
            </div>
          )}

          {report.fotoEvidenciaUrl && (
            <div>
              <p className="label mb-2">Foto de evidencia (resolución)</p>
              <img
                src={report.fotoEvidenciaUrl}
                alt="Foto evidencia"
                className="rounded-xl w-full max-h-48 object-cover border border-slate-200"
              />
            </div>
          )}

          {/* ─── Actualizar estado ────────────────────────────────────────── */}
          <div className="border-t border-slate-100 pt-5">
            <p className="section-title mb-4">Actualizar estado</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {ESTADOS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEstado(e)}
                  className={clsx(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all',
                    newEstado === e
                      ? ESTADO_STYLES[e] + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {ESTADO_LABELS[e]}
                </button>
              ))}
            </div>

            <div>
              <label className="label mb-1.5 block">
                Comentario de resolución <span className="font-normal lowercase">(opcional)</span>
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="Describí cómo se solucionó el problema…"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>

            {saveError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="btn-primary"
          >
            {saving && <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label, children, className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="label mb-0.5">{label}</p>
      <div className="text-sm text-slate-900">{children}</div>
    </div>
  );
}
