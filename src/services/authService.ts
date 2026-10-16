/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdminUser } from '../types';

const STORAGE_KEY_ADMIN_TOKEN = 'my_calc_admin_token';
const STORAGE_KEY_ADMIN_USER = 'my_calc_admin_user';
const STORAGE_KEY_ADMIN_CUSTOM_PWD = 'my_calc_admin_custom_pwd_v1';

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
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // 1. Attempt server-side login
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });

    if (response.ok) {
      const data = await response.json();
      const adminUser: AdminUser = {
        email: data.user.email,
        displayName: data.user.displayName,
        role: data.user.role,
        token: data.token,
      };
      setStoredAdminSession(adminUser);
      return { success: true, user: adminUser };
    }

    // If server specifically returned an invalid password or unauthorized error
    if (response.status === 400 || response.status === 401) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || 'Incorrect administrator password.' };
    }
  } catch {
    // Server is unreachable (e.g. static CDN deployment)
  }

  // 2. Client-side authentication fallback for static deployments
  const isMatchEmail =
    cleanEmail === 'malik.shahmeer@creator.com' ||
    cleanEmail === 'malik@shahmeer.com' ||
    cleanEmail === 'sherro31270@gmail.com';

  if (!isMatchEmail) {
    return { success: false, error: 'Access restricted: Unrecognized administrator account.' };
  }

  const customPwd = localStorage.getItem(STORAGE_KEY_ADMIN_CUSTOM_PWD);
  const validPassword = customPwd || 'merimarzi';

  if (cleanPassword !== validPassword) {
    return { success: false, error: 'Incorrect administrator password.' };
  }

  const fallbackToken = `adm_sec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
  const adminUser: AdminUser = {
    email: cleanEmail,
    displayName: 'Malik Shahmeer',
    role: 'Administrator & Creator',
    token: fallbackToken,
  };

  setStoredAdminSession(adminUser);
  return { success: true, user: adminUser };
}

export async function resetAdminPassword(
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  // 1. Try server reset
  try {
    const response = await fetch('/api/admin/password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(STORAGE_KEY_ADMIN_CUSTOM_PWD, newPassword);
      return { success: true, message: data.message };
    }
  } catch {
    // Server unreachable
  }

  // 2. Fallback update
  const customPwd = localStorage.getItem(STORAGE_KEY_ADMIN_CUSTOM_PWD) || 'merimarzi';
  if (currentPassword !== customPwd) {
    return { success: false, error: 'Current password verification failed.' };
  }

  localStorage.setItem(STORAGE_KEY_ADMIN_CUSTOM_PWD, newPassword);
  return { success: true, message: 'Administrator password updated successfully.' };
}
