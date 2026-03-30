// ─── Enumeraciones ─────────────────────────────────────────────────────────────

export type Rol = 'REPORTANTE' | 'RESPONSABLE' | 'SUPERVISOR';

export type TipoProblema =
  | 'PIEDRAS_VIA'
  | 'VIA_SIN_AFIRMADO'
  | 'VOLQUETES'
  | 'MUCHA_PENDIENTE'
  | 'SENALIZACION'
  | 'TIEMPO_ESPERA'
  | 'DERRUMBE'
  | 'CAMBIO_TRAZO';

export type EstadoReporte = 'PENDIENTE' | 'EN_PROCESO' | 'SOLUCIONADO';

// ─── Modelos ───────────────────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  email: string;
  rol: Rol;
  pushToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reporte {
  id: string;
  tipoProblema: TipoProblema;
  comentario?: string;
  fotoUrl?: string;
  latitud: number;
  longitud: number;
  fechaCreacion: string;
  updatedAt: string;
  estado: EstadoReporte;
  comentarioResolucion?: string;
  fotoEvidenciaUrl?: string;
  sincronizadoEn?: string | null;
  reportanteId: string;
  reportante?: Omit<Usuario, 'pushToken'>;
}

export interface Comunicado {
  id: string;
  mensaje: string;
  fechaPublicacion: string;
  duracionRestriccion?: number | null;
  responsableId: string;
  responsable?: Pick<Usuario, 'id' | 'email'>;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
}

export interface JwtUser {
  sub: string;
  email: string;
  rol: Rol;
  iat: number;
  exp: number;
}

// ─── Constantes de UI ──────────────────────────────────────────────────────────

export const TIPO_LABELS: Record<TipoProblema, string> = {
  PIEDRAS_VIA:      'Piedras en la vía',
  VIA_SIN_AFIRMADO: 'Vía sin afirmado',
  VOLQUETES:        'Volquetes no dan pase',
  MUCHA_PENDIENTE:  'Mucha pendiente',
  SENALIZACION:     'Deficiente señalización',
  TIEMPO_ESPERA:    'Mucho tiempo de espera',
  DERRUMBE:         'Derrumbe',
  CAMBIO_TRAZO:     'Cambio de trazo',
};

export const ESTADO_LABELS: Record<EstadoReporte, string> = {
  PENDIENTE:   'Pendiente',
  EN_PROCESO:  'En proceso',
  SOLUCIONADO: 'Solucionado',
};

export const ESTADO_STYLES: Record<EstadoReporte, string> = {
  PENDIENTE:   'bg-red-100 text-red-700 border border-red-200',
  EN_PROCESO:  'bg-amber-100 text-amber-700 border border-amber-200',
  SOLUCIONADO: 'bg-green-100 text-green-700 border border-green-200',
};

export const ESTADO_MAP_COLORS: Record<EstadoReporte, string> = {
  PENDIENTE:   '#ef4444',
  EN_PROCESO:  '#f59e0b',
  SOLUCIONADO: '#22c55e',
};

export const TIPOS  = Object.keys(TIPO_LABELS)  as TipoProblema[];
export const ESTADOS = Object.keys(ESTADO_LABELS) as EstadoReporte[];
