/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisitorRecord } from '../types';

const STORAGE_KEY_VISITOR_ID = 'my_calc_visitor_id';
const STORAGE_KEY_VISITOR_NAME = 'my_calc_visitor_name';

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

/**
 * Record a real visitor entry in the server database.
 */
export async function recordVisitorEntry(name: string): Promise<{ visitor: VisitorRecord; isReturning: boolean }> {
  const visitorId = getCachedVisitorId();
  const response = await fetch('/api/visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), visitorId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to record visit' }));
    throw new Error(err.error || 'Failed to record visit');
  }

  const data = await response.json();
  setCachedVisitorSession(data.visitor.id, data.visitor.name);
  return data;
}

/**
 * Fetch all real visitor records from the server (Admin authorization required).
 */
export async function fetchAllVisitorRecords(adminToken: string): Promise<{ visitors: VisitorRecord[]; stats: { totalVisits: number; uniqueCount: number } }> {
  const response = await fetch('/api/visitors', {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unauthorized or database error' }));
    throw new Error(err.error || 'Failed to fetch visitor records');
  }

  return response.json();
}

/**
 * Delete a specific visitor record from the server database (Admin authorization required).
 */
export async function deleteVisitorRecord(id: string, adminToken: string): Promise<void> {
  const response = await fetch(`/api/visitors/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to delete record' }));
    throw new Error(err.error || 'Failed to delete record');
  }
}

/**
 * Clear all visitor records from the server database (Admin authorization required).
 */
export async function clearAllVisitorRecords(adminToken: string): Promise<void> {
  const response = await fetch('/api/visitors', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to clear records' }));
    throw new Error(err.error || 'Failed to clear records');
  }
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
