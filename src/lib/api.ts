import axios from 'axios';
import type { Comunicado, EstadoReporte, LoginResponse, Reporte, Usuario } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Inyectar JWT en cada request ─────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Redirigir a /login en 401 ────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      document.cookie = 'admin_token=; path=/; max-age=0';
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ─── API methods ───────────────────────────────────────────────────────────────

export const AuthAPI = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),
};

export const ReportsAPI = {
  getAll: () => apiClient.get<Reporte[]>('/reports'),

  getById: (id: string) => apiClient.get<Reporte>(`/reports/${id}`),

  updateStatus: (id: string, estado: EstadoReporte, comentarioResolucion?: string) =>
    apiClient.patch<Reporte>(`/reports/${id}/status`, {
      estado,
      ...(comentarioResolucion?.trim() && { comentarioResolucion }),
    }),
};

export const ComunicadosAPI = {
  getAll: () => apiClient.get<Comunicado[]>('/comunicados'),

  create: (mensaje: string, duracionRestriccion?: number) =>
    apiClient.post<Comunicado>('/comunicados', {
      mensaje,
      ...(duracionRestriccion && duracionRestriccion > 0 ? { duracionRestriccion } : {}),
    }),
};

export const UsersAPI = {
  getAll: () => apiClient.get<Usuario[]>('/users'),
};
