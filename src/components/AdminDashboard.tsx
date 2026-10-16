/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Eye,
  Calendar,
  Search,
  Download,
  Trash2,
  LogOut,
  ShieldCheck,
  Database,
  ArrowLeft,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { VisitorRecord, AdminUser, ThemeMode } from '../types';
import {
  fetchAllVisitorRecords,
  deleteVisitorRecord,
  clearAllVisitorRecords,
  exportVisitorsToCSV,
} from '../services/visitorService';
import { resetAdminPassword } from '../services/authService';

interface AdminDashboardProps {
  adminUser: AdminUser;
  onLogoutAdmin: () => void;
  onBackToCalculator: () => void;
  theme: ThemeMode;
}

type DateFilterType = 'all' | 'today' | '7days' | '30days';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogoutAdmin,
  onBackToCalculator,
  theme,
}) => {
  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<VisitorRecord | null>(null);

  // Password reset state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const isDark = theme === 'dark';

  // Load real data from server database
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllVisitorRecords(adminUser.token);
      setRecords(data.visitors || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch visitor records';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [adminUser.token]);

  // Filter records
  const filteredRecords = useMemo(() => {
    let result = records;

    // Search by name or ID
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
      );
    }

    // Date range filter
    const now = Date.now();
    if (dateFilter === 'today') {
      const startOfToday = new Date().setHours(0, 0, 0, 0);
      result = result.filter((r) => r.lastVisit >= startOfToday);
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = now - 7 * 86400000;
      result = result.filter((r) => r.lastVisit >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = now - 30 * 86400000;
      result = result.filter((r) => r.lastVisit >= thirtyDaysAgo);
    }

    return result;
  }, [records, searchQuery, dateFilter]);

  // Aggregated Statistics (Real numbers from real records)
  const totalVisitsCount = useMemo(() => {
    return records.reduce((acc, curr) => acc + (curr.visitCount || 1), 0);
  }, [records]);

  const uniqueVisitorCount = records.length;

  const todayVisitsCount = useMemo(() => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    return records
      .filter((r) => r.lastVisit >= startOfToday)
      .reduce((acc, curr) => acc + (curr.visitCount || 1), 0);
  }, [records]);

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteVisitorRecord(id, adminUser.token);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setRecordToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete record');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllVisitorRecords(adminUser.token);
      setRecords([]);
      setShowClearAllModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to clear records');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    setPwdLoading(true);

    try {
      const result = await resetAdminPassword(currentPwd, newPwd, adminUser.token);
      if (result.success) {
        setPwdMsg({ type: 'success', text: result.message || 'Password changed successfully.' });
        setCurrentPwd('');
        setNewPwd('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPwdMsg(null);
        }, 1500);
      } else {
        setPwdMsg({ type: 'error', text: result.error || 'Failed to update password' });
      }
    } catch {
      setPwdMsg({ type: 'error', text: 'Error communicating with server.' });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div
      className={`min-h-[calc(100vh-70px)] p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToCalculator}
              className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium border ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Calculator</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Administrator Analytics
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30">
                  Malik Shahmeer
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real-time persistent visitor database & session control
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadData}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1 ${
                isDark
                  ? 'bg-[#1C1C1E] border-neutral-800 text-neutral-300 hover:text-white'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:text-black'
              }`}
              title="Refresh database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF9F0A]' : ''}`} />
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isDark
                  ? 'bg-[#1C1C1E] border-neutral-800 text-neutral-300 hover:text-white'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:text-black'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-[#FF9F0A]" />
              <span>Change Password</span>
            </button>

            <button
              onClick={() => exportVisitorsToCSV(filteredRecords)}
              disabled={filteredRecords.length === 0}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#FF9F0A] text-black hover:bg-[#e08c07] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onLogoutAdmin}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isDark
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                  : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Database Status Banner */}
        <div
          className={`p-4 rounded-3xl border flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-200`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Real Cloud-Persistent Database Connected</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  LIVE PRODUCTION
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Zero fake records. Live timestamps, repeat visit tracking, and protected administrator endpoints.
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#1C1C1E] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium">Total Recorded Visits</span>
              <Eye className="w-4 h-4 text-[#FF9F0A]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FF9F0A] font-mono">
              {totalVisitsCount}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Sum of all visitor entries</p>
          </div>

          <div
            className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#1C1C1E] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium">Unique Named Profiles</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              {uniqueVisitorCount}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Distinct visitor names</p>
          </div>

          <div
            className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#1C1C1E] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium">Today's Visits</span>
              <Calendar className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-sky-400">
              {todayVisitsCount}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Past 24 hours</p>
          </div>

          <div
            className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#1C1C1E] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium">Repeat Engagement</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-400">
              {uniqueVisitorCount > 0 ? (totalVisitsCount / uniqueVisitorCount).toFixed(1) : '0'}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Visits per visitor</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          className={`p-4 rounded-3xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
            isDark ? 'bg-[#1C1C1E] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
          }`}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search visitor by name or ID..."
              className={`w-full pl-10 pr-4 py-2 rounded-2xl text-xs sm:text-sm font-medium outline-none border transition-all ${
                isDark
                  ? 'bg-[#2C2C2E] border-neutral-700 text-white placeholder-neutral-500 focus:border-[#FF9F0A]'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-[#FF9F0A]'
              }`}
            />
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['all', 'today', '7days', '30days'] as DateFilterType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setDateFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  dateFilter === tab
                    ? 'bg-[#FF9F0A] text-black font-semibold'
                    : isDark
                    ? 'bg-neutral-900 text-neutral-400 hover:text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:text-black'
                }`}
              >
                {tab === 'all'
                  ? 'All Time'
                  : tab === 'today'
                  ? 'Today'
                  : tab === '7days'
                  ? 'Last 7 Days'
                  : 'Last 30 Days'}
              </button>
            ))}

            {records.length > 0 && (
              <button
                onClick={() => setShowClearAllModal(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/30 flex items-center gap-1 ml-1"
                title="Clear all records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Visitors Table Card */}
        <div
          className={`rounded-3xl border overflow-hidden ${
            isDark ? 'bg-[#1C1C1E] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
          }`}
        >
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF9F0A]" />
              <h3 className="font-bold text-sm">Visitor Records Database</h3>
              <span className="text-xs text-neutral-400 font-mono">({filteredRecords.length} records)</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Live server timestamps
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b ${
                  isDark ? 'border-neutral-800 bg-[#2C2C2E]/40 text-neutral-400' : 'border-neutral-200 bg-neutral-100 text-neutral-600'
                }`}
              >
                <tr>
                  <th className="py-3 px-4 font-semibold">Visitor Name</th>
                  <th className="py-3 px-4 font-semibold">Identifier</th>
                  <th className="py-3 px-4 font-semibold">Visits</th>
                  <th className="py-3 px-4 font-semibold">First Recorded Visit</th>
                  <th className="py-3 px-4 font-semibold">Most Recent Visit</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
                      Loading database records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
                      No visitor records recorded yet. As new visitors enter their names, their visits will appear here in real time.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A] flex items-center justify-center font-bold text-xs uppercase border border-[#FF9F0A]/20">
                          {r.name.charAt(0)}
                        </div>
                        <span className="text-sm">{r.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">
                        {r.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30">
                          {r.visitCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400">
                        {new Date(r.firstVisit).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300 font-medium">
                        {new Date(r.lastVisit).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setRecordToDelete(r)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal & Privacy Compliance Card */}
        <div
          className={`p-4 rounded-3xl border ${
            isDark ? 'bg-[#1C1C1E] border-neutral-800' : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#FF9F0A] shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-400 leading-relaxed">
              <strong className="text-neutral-200 block mb-1">
                Data Collection Scope & Identity Disclaimer
              </strong>
              Only the self-reported visitor name, session count, and timestamps are recorded for this application. No passwords, personal documents, device telemetry, or IP geolocation are stored. Names are entered manually by visitors and do not establish verified real-world identity.
            </div>
          </div>
        </div>
      </div>

      {/* Delete Single Record Confirmation Dialog */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
              isDark ? 'bg-[#1C1C1E] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Delete Record?</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Are you sure you want to remove the record for{' '}
              <strong className="text-white">"{recordToDelete.name}"</strong>? This will permanently delete the entry from the database.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={() => handleDeleteRecord(recordToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
              isDark ? 'bg-[#1C1C1E] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Clear All Records?</h3>
            <p className="text-xs text-neutral-400 mt-1">
              This will permanently delete all {records.length} visitor entries from the server database.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
              >
                Clear Everything
              </button>
              <button
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
              isDark ? 'bg-[#1C1C1E] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <h3 className="text-lg font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#FF9F0A]" />
              Update Administrator Password
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Change the password for creator Malik Shahmeer.
            </p>

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-[#FF9F0A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-[#FF9F0A]"
                />
              </div>

              {pwdMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    pwdMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {pwdMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{pwdMsg.text}</span>
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex-1 py-2 rounded-xl bg-[#FF9F0A] hover:bg-[#e08c07] text-black text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
