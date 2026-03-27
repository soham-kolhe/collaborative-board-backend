import axios from 'axios';
import type { AuthResponse } from '../types';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const BASE_URL = `${API_URL}/api/auth`;
export async function loginApi(userName: string, password: string): Promise<AuthResponse> {
  const res = await axios.post(`${BASE_URL}/login`, { userName, password });
  return res.data;
}

export async function registerApi(userName: string, password: string): Promise<AuthResponse> {
  const res = await axios.post(`${BASE_URL}/register`, { userName, password });
  return res.data;
}

export function getStoredToken(): string | null {
  return localStorage.getItem('wb_token');
}

export function getStoredUser(): { id: string; userName: string } | null {
  const raw = localStorage.getItem('wb_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: { id: string; userName: string }) {
  localStorage.setItem('wb_token', token);
  localStorage.setItem('wb_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('wb_token');
  localStorage.removeItem('wb_user');
}
