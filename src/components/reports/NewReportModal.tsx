'use client';

import { useState } from 'react';
import { X, MapPin, Camera, AlertCircle } from 'lucide-react';
import { TIPOS, TIPO_LABELS, type TipoProblema } from '@/lib/types';
import toast from 'react-hot-toast';
import { ReportsAPI } from '@/lib/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewReportModal({ onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState<TipoProblema>(TIPOS[0]);
  const [comentario, setComentario] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Las coordenadas deben ser números válidos.');
      return;
    }

    setSaving(true);
    try {
      // Nota: El backend podría requerir más campos o un formato específico.
      // Basado en ReportsAPI.getAll, no hay un método create, así que asumimos uno.
      // @ts-ignore - Implementaremos este método en ReportsAPI
      await ReportsAPI.create({
        tipoProblema: tipo,
        comentario: comentario || undefined,
        latitud: lat,
        longitud: lng,
      });

      toast.success('Reporte creado exitosamente.');
      onSuccess();
    } catch (err) {
      toast.error('Error al crear el reporte.');
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no es soportada por este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude.toFixed(6));
        setLongitud(pos.coords.longitude.toFixed(6));
        toast.success('Ubicación obtenida.');
      },
      () => {
        toast.error('No se pudo obtener la ubicación.');
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Nuevo Reporte</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="label mb-1.5 block">Tipo de Problema</label>
            <select
              className="input-field"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoProblema)}
              required
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>{TIPO_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-1.5 block">Comentario (opcional)</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Describí el incidente…"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Latitud</label>
              <input
                type="text"
                className="input-field"
                placeholder="-34.6037"
                value={latitud}
                onChange={(e) => setLatitud(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Longitud</label>
              <input
                type="text"
                className="input-field"
                placeholder="-58.3816"
                value={longitud}
                onChange={(e) => setLongitud(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="button"
            onClick={useCurrentLocation}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <MapPin className="h-4 w-4" />
            Usar mi ubicación actual
          </button>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">
              Desde el panel administrativo los reportes se crean sin foto. El usuario móvil podrá adjuntarla luego si es necesario.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Guardando…' : 'Crear Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
