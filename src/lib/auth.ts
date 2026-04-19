import { authApi } from './api';

const TOKEN_KEY = 'noteflow_token';
const USER_KEY = 'noteflow_user';

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const s = localStorage.getItem(USER_KEY);
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

export function storeAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function signIn(email: string, password: string): Promise<User> {
  const { token, user } = await authApi.login(email, password);
  storeAuth(token, user);
  return user;
}

export async function signUp(email: string, password: string, fullName: string): Promise<User> {
  const { token, user } = await authApi.register(email, password, fullName);
  storeAuth(token, user);
  return user;
}

export function signOut() {
  clearAuth();
  window.location.href = '/auth';
}
