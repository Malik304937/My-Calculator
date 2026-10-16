/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisitorRecord } from '../types';

const STORAGE_KEY_VISITOR_ID = 'my_calc_visitor_id';
const STORAGE_KEY_VISITOR_NAME = 'my_calc_visitor_name';
const STORAGE_KEY_LOCAL_RECORDS = 'my_calc_persistent_visitors_store';

export function getCachedVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_VISITOR_ID);
}

export function getCachedVisitorName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_VISITOR_NAME);
}

export function setCachedVisitorSession(id: string, name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_VISITOR_ID, id);
  localStorage.setItem(STORAGE_KEY_VISITOR_NAME, name);
  sessionStorage.setItem(STORAGE_KEY_VISITOR_NAME, name);
}

export function clearCachedVisitorSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_VISITOR_NAME);
  sessionStorage.removeItem(STORAGE_KEY_VISITOR_NAME);
}

function getLocalStoredVisitors(): VisitorRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalStoredVisitors(records: VisitorRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_RECORDS, JSON.stringify(records));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Record a real visitor entry in the server database, with resilient local fallback for static deployments.
 */
export async function recordVisitorEntry(
  name: string
): Promise<{ visitor: VisitorRecord; isReturning: boolean }> {
  const cleanName = name.trim();
  const visitorId = getCachedVisitorId();

  // 1. Attempt server-side recording first
  try {
    const response = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, visitorId }),
    });

    if (response.ok) {
      const data = await response.json();
      setCachedVisitorSession(data.visitor.id, data.visitor.name);

      // Sync local records mirror
      const local = getLocalStoredVisitors();
      const existingIdx = local.findIndex((v) => v.id === data.visitor.id);
      if (existingIdx >= 0) {
        local[existingIdx] = data.visitor;
      } else {
        local.unshift(data.visitor);
      }
      saveLocalStoredVisitors(local);

      return data;
    }
  } catch {
    // Server is unreachable (e.g. static CDN deployment or offline)
  }

  // 2. Resilient persistent local database fallback
  const now = Date.now();
  const localRecords = getLocalStoredVisitors();
  let matched = visitorId ? localRecords.find((r) => r.id === visitorId) : null;

  if (!matched) {
    matched = localRecords.find((r) => r.name.toLowerCase() === cleanName.toLowerCase()) || null;
  }

  if (matched) {
    matched.lastVisit = now;
    matched.visitCount = (matched.visitCount || 1) + 1;
    matched.name = cleanName;
    saveLocalStoredVisitors(localRecords);
    setCachedVisitorSession(matched.id, matched.name);
    return { visitor: matched, isReturning: true };
  }

  const newId = `vis_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const newVisitor: VisitorRecord = {
    id: newId,
    name: cleanName,
    firstVisit: now,
    lastVisit: now,
    visitCount: 1,
    platform: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
  };

  localRecords.unshift(newVisitor);
  saveLocalStoredVisitors(localRecords);
  setCachedVisitorSession(newId, cleanName);
  return { visitor: newVisitor, isReturning: false };
}

/**
 * Fetch all real visitor records (Admin authorization required).
 */
export async function fetchAllVisitorRecords(
  adminToken: string
): Promise<{ visitors: VisitorRecord[]; stats: { totalVisits: number; uniqueCount: number } }> {
  // 1. Attempt server fetch
  try {
    const response = await fetch('/api/visitors', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      saveLocalStoredVisitors(data.visitors || []);
      return data;
    }
  } catch {
    // Fallback to local persistent mirror
  }

  // 2. Return local records
  const local = getLocalStoredVisitors();
  const totalVisits = local.reduce((acc, curr) => acc + (curr.visitCount || 1), 0);
  return {
    visitors: local,
    stats: {
      totalVisits,
      uniqueCount: local.length,
    },
  };
}

/**
 * Delete a specific visitor record from the database.
 */
export async function deleteVisitorRecord(id: string, adminToken: string): Promise<void> {
  try {
    await fetch(`/api/visitors/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
  } catch {
    // Continue to update local store
  }

  const local = getLocalStoredVisitors();
  const filtered = local.filter((r) => r.id !== id);
  saveLocalStoredVisitors(filtered);
}

/**
 * Clear all visitor records.
 */
export async function clearAllVisitorRecords(adminToken: string): Promise<void> {
  try {
    await fetch('/api/visitors', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
  } catch {
    // Continue
  }
  saveLocalStoredVisitors([]);
}

/**
 * Export real records to CSV
 */
export function exportVisitorsToCSV(records: VisitorRecord[]): void {
  if (!records || records.length === 0) return;

  const headers = ['Unique ID', 'Visitor Name', 'Total Visits', 'First Visit Date', 'Last Visit Date', 'Device Platform'];
  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.name.replace(/"/g, '""')}"`,
    r.visitCount,
    `"${new Date(r.firstVisit).toISOString()}"`,
    `"${new Date(r.lastVisit).toISOString()}"`,
    `"${(r.platform || 'Desktop').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `my_calculator_real_visitors_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
