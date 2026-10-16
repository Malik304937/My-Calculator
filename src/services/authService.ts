/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdminUser } from '../types';

const STORAGE_KEY_ADMIN_TOKEN = 'my_calc_admin_token';
const STORAGE_KEY_ADMIN_USER = 'my_calc_admin_user';

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ADMIN_USER);
    const token = sessionStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
    if (!raw || !token) return null;
    const user = JSON.parse(raw);
    return { ...user, token };
  } catch {
    return null;
  }
}

export function setStoredAdminSession(user: AdminUser): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY_ADMIN_TOKEN, user.token);
  sessionStorage.setItem(
    STORAGE_KEY_ADMIN_USER,
    JSON.stringify({ email: user.email, displayName: user.displayName, role: user.role })
  );
}

export function clearStoredAdminSession(): void {
  if (typeof window === 'undefined') return;
  const token = sessionStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
  if (token) {
    fetch('/api/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  sessionStorage.removeItem(STORAGE_KEY_ADMIN_TOKEN);
  sessionStorage.removeItem(STORAGE_KEY_ADMIN_USER);
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Authentication failed' };
    }

    const adminUser: AdminUser = {
      email: data.user.email,
      displayName: data.user.displayName,
      role: data.user.role,
      token: data.token,
    };

    setStoredAdminSession(adminUser);
    return { success: true, user: adminUser };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server connection failed';
    return { success: false, error: msg };
  }
}

export async function resetAdminPassword(
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/admin/password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Password update failed' };
    }

    return { success: true, message: data.message };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection failed';
    return { success: false, error: msg };
  }
}
