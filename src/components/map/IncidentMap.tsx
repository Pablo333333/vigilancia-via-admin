'use client';

import { GoogleMap, InfoWindowF, MarkerF, useLoadScript } from '@react-google-maps/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { ESTADO_LABELS, ESTADO_MAP_COLORS, TIPO_LABELS } from '@/lib/types';
import type { Reporte } from '@/lib/types';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

// Centro por defecto: Argentina (Buenos Aires area) — se ajusta si hay reportes
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

interface Props {
  reports: Reporte[];
}

export default function IncidentMap({ reports }: Props) {
  const [selected, setSelected] = useState<Reporte | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  });

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 p-8 text-center">
        <div>
          <p className="font-semibold text-red-600 mb-1">No se pudo cargar Google Maps</p>
          <p className="text-sm">
            Verificá que la variable <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> esté configurada en <code className="bg-slate-100 px-1 rounded">.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  // Centrar en el primer reporte disponible
  const center =
    reports.length > 0
      ? { lat: reports[0].latitud, lng: reports[0].longitud }
      : DEFAULT_CENTER;

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={12}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControlOptions: { position: 9 /* RIGHT_BOTTOM */ },
      }}
      onClick={() => setSelected(null)}
    >
      {reports.map((r) => (
        <MarkerF
          key={r.id}
          position={{ lat: r.latitud, lng: r.longitud }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: ESTADO_MAP_COLORS[r.estado],
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
          onClick={(e) => {
            e.stop?.();
            setSelected(r);
          }}
        />
      ))}

      {selected && (
        <InfoWindowF
          position={{ lat: selected.latitud, lng: selected.longitud }}
          onCloseClick={() => setSelected(null)}
          options={{ maxWidth: 300 }}
        >
          <div className="p-1 min-w-[200px]">
            <div className="flex items-start gap-2 mb-2">
              <span
                className="mt-0.5 h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: ESTADO_MAP_COLORS[selected.estado] }}
              />
              <div>
                <p className="font-semibold text-slate-900 text-sm leading-tight">
                  {TIPO_LABELS[selected.tipoProblema]}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ESTADO_LABELS[selected.estado]}
                </p>
              </div>
            </div>

            {selected.comentario && (
              <p className="text-xs text-slate-600 italic mb-2 border-l-2 border-slate-200 pl-2">
                &ldquo;{selected.comentario}&rdquo;
              </p>
            )}

            <div className="text-xs text-slate-500 space-y-0.5">
              <p>
                <span className="font-medium">Fecha:</span>{' '}
                {format(parseISO(selected.fechaCreacion), "dd MMM yyyy HH:mm", { locale: es })}
              </p>
              {selected.reportante && (
                <p>
                  <span className="font-medium">Reportó:</span> {selected.reportante.email}
                </p>
              )}
              <p className="font-mono text-[10px] text-slate-400 mt-1">
                {selected.latitud.toFixed(5)}, {selected.longitud.toFixed(5)}
              </p>
            </div>

            {selected.fotoUrl && (
              <img
                src={selected.fotoUrl}
                alt="Foto del incidente"
                className="mt-2 rounded w-full max-h-32 object-cover"
              />
            )}
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
