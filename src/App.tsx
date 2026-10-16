/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeMode, CalculationRecord, AdminUser } from './types';
import { HeaderNav } from './components/HeaderNav';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CalculatorScreen } from './components/CalculatorScreen';
import { HistoryPanel } from './components/HistoryPanel';
import { CreatorModal } from './components/CreatorModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import {
  recordVisitorEntry,
  getCachedVisitorName,
  clearCachedVisitorSession,
} from './services/visitorService';
import {
  getStoredAdminUser,
  clearStoredAdminSession,
} from './services/authService';

const STORAGE_KEY_HISTORY = 'my_calc_history_records';
const STORAGE_KEY_THEME = 'my_calc_theme_pref';
const STORAGE_KEY_SOUND = 'my_calc_sound_pref';

export default function App() {
  // Visitor session
  const [visitorName, setVisitorName] = useState<string | null>(() => getCachedVisitorName());

  // Current view screen
  const [currentView, setCurrentView] = useState<'welcome' | 'calculator' | 'admin'>(() => {
    if (typeof window !== 'undefined' && getCachedVisitorName()) {
      return 'calculator';
    }
    return 'welcome';
  });

  // Admin user
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getStoredAdminUser());

  // Calculation History
  const [history, setHistory] = useState<CalculationRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Settings
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode;
      return saved === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_SOUND) === 'true';
    }
    return false; // Disabled by default as requested
  });

  // Modals
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [externalLoadValue, setExternalLoadValue] = useState<string | null>(null);

  const handleClearExternalLoad = React.useCallback(() => {
    setExternalLoadValue(null);
  }, []);

  // Sync theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.backgroundColor = '#000000';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.backgroundColor = '#f5f5f7';
      }
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    }
  }, [theme]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_SOUND, String(next));
      return next;
    });
  };

  // Handle visitor sign in (real server database)
  const handleVisitorEnter = async (enteredName: string) => {
    const { visitor } = await recordVisitorEntry(enteredName);
    setVisitorName(visitor.name);
    // Smooth transition to calculator
    setTimeout(() => {
      setCurrentView('calculator');
    }, 800);
  };

  // Handle visitor logout
  const handleVisitorLogout = () => {
    clearCachedVisitorSession();
    setVisitorName(null);
    setCurrentView('welcome');
  };

  // Add history calculation
  const handleAddHistory = (record: CalculationRecord) => {
    setHistory((prev) => {
      const updated = [record, ...prev.slice(0, 49)];
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  };

  // Admin handlers
  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    clearStoredAdminSession();
    setAdminUser(null);
    if (visitorName) {
      setCurrentView('calculator');
    } else {
      setCurrentView('welcome');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-black text-white' : 'bg-[#F5F5F7] text-neutral-900'
      }`}
    >
      {/* Header Navigation */}
      <HeaderNav
        visitorName={visitorName}
        onLogoutVisitor={handleVisitorLogout}
        onOpenCreator={() => setIsCreatorOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenAdmin={() => {
          if (adminUser) {
            setCurrentView('admin');
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        isAdminLoggedIn={Boolean(adminUser)}
      />

      {/* Main View */}
      <main className="flex-1 flex flex-col">
        {currentView === 'welcome' && (
          <WelcomeScreen
            onEnter={handleVisitorEnter}
            returningVisitorName={visitorName}
            onClearReturningSession={() => {
              clearCachedVisitorSession();
              setVisitorName(null);
            }}
            onOpenCreator={() => setIsCreatorOpen(true)}
            onOpenAdmin={() => setIsAdminLoginOpen(true)}
            theme={theme}
          />
        )}

        {currentView === 'calculator' && (
          <div className="flex-1 flex flex-col justify-center items-center py-6 px-4">
            <CalculatorScreen
              onAddHistory={handleAddHistory}
              externalLoadValue={externalLoadValue}
              onClearExternalLoad={handleClearExternalLoad}
              soundEnabled={soundEnabled}
              theme={theme}
            />
          </div>
        )}

        {currentView === 'admin' && adminUser && (
          <AdminDashboard
            adminUser={adminUser}
            onLogoutAdmin={handleAdminLogout}
            onBackToCalculator={() => setCurrentView(visitorName ? 'calculator' : 'welcome')}
            theme={theme}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenCreator={() => setIsCreatorOpen(true)}
        onOpenAdmin={() => {
          if (adminUser) {
            setCurrentView('admin');
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        theme={theme}
      />

      {/* Calculation History Modal */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onSelectCalculation={(item) => {
          setExternalLoadValue(item.result);
          if (currentView !== 'calculator') {
            setCurrentView('calculator');
          }
        }}
        theme={theme}
      />

      {/* Creator Profile Modal ("Meet the Creator") */}
      <CreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onAdminClick={() => {
          if (adminUser) {
            setCurrentView('admin');
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        theme={theme}
      />

      {/* Administrator Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        theme={theme}
      />
    </div>
  );
}
