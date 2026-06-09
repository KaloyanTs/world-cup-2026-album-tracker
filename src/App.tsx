/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CollectionState, Sticker } from './types';
import {
  generateAllStickers,
  generateInitialCollectionState,
  TEAMS
} from './data';
import { DashboardView } from './components/DashboardView';
import { MyAlbumView } from './components/MyAlbumView';
import { TradingView, ActivityEntry, AdjustmentEntry } from './components/TradingView';
import { TeamsView } from './components/TeamsView';
import { TeamDetailsView } from './components/TeamDetailsView';
import { CheckView } from './components/CheckView';
import { NeedsMatcherView } from './components/NeedsMatcherView';

import {
  Home,
  BookOpen,
  ArrowUpDown,
  Flag,
  Search,
  Settings,
  HelpCircle,
  Menu,
  Handshake,
  X,
  AlertCircle,
  CheckCircle,
  Download,
  Copy,
  FileJson,
  User,
  ClipboardCheck
} from 'lucide-react';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

const normalizeCollectionState = (value: unknown): CollectionState => {
  const fallback = generateInitialCollectionState();

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const parsed = value as Partial<CollectionState>;

  return {
    ...fallback,
    ...parsed,
    counts:
      parsed.counts && typeof parsed.counts === 'object'
        ? parsed.counts
        : fallback.counts ?? {},
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showExportDupsModal, setShowExportDupsModal] = useState(false);

  const allStickers = useMemo(() => generateAllStickers(), []);

  const getSortedStickers = (stickers: Sticker[]) => {
    return [...stickers].sort((a, b) => {
      // 1. Panini Logo 00 first
      if (a.id === "00") return -1;
      if (b.id === "00") return 1;

      const aIsFwc = a.id.startsWith("FWC-");
      const bIsFwc = b.id.startsWith("FWC-");

      // 2. FWC-1 to FWC-8 (Tournament info & Hosts)
      if (aIsFwc && !bIsFwc) {
        const num = parseInt(a.id.split("-")[1]);
        return num <= 8 ? -1 : 1;
      }
      if (!aIsFwc && bIsFwc) {
        const num = parseInt(b.id.split("-")[1]);
        return num <= 8 ? 1 : -1;
      }
      if (aIsFwc && bIsFwc) {
        const aNum = parseInt(a.id.split("-")[1]);
        const bNum = parseInt(b.id.split("-")[1]);
        
        // Handle FWC-1..8 vs FWC-9..19
        const aCategory = aNum <= 8 ? 0 : 2;
        const bCategory = bNum <= 8 ? 0 : 2;
        
        if (aCategory !== bCategory) return aCategory - bCategory;
        return aNum - bNum;
      }

      // 3. Teams (by TEAMS array position)
      if (a.teamCode && b.teamCode) {
        if (a.teamCode === b.teamCode) {
          return (a.number || 0) - (b.number || 0);
        }
        const aIdx = TEAMS.findIndex(t => t.code === a.teamCode);
        const bIdx = TEAMS.findIndex(t => t.code === b.teamCode);
        return aIdx - bIdx;
      }

      return 0;
    });
  };

  const handleCopyMissingSorted = async () => {
    const sorted = getSortedStickers(allStickers);
    const missing = sorted
      .filter(s => (collection.counts[s.id] || 0) === 0)
      .map(s => s.id);

    const text = missing.join(', ');
    try {
      await Clipboard.write({ string: text });
      addToast({ type: 'success', text: 'Missing stickers copied to clipboard!' });
    } catch (e) {
      addToast({ type: 'error', text: 'Failed to copy to clipboard' });
    }
  };

  const handleExportAll = async () => {
    const sorted = getSortedStickers(allStickers);
    const data = sorted.map(s => ({
      id: s.id,
      name: s.name,
      count: collection.counts[s.id] || 0
    }));

    const json = JSON.stringify(data, null, 2);
    try {
      await Share.share({
        title: 'WC26 Album - Full Export',
        text: json,
        dialogTitle: 'Export All Stickers'
      });
    } catch (e) {
      console.error('Export failed', e);
      addToast({ type: 'error', text: 'Export failed' });
    }
  };

  const handleExportDuplicates = async (format: 'json' | 'clipboard') => {
    const sorted = getSortedStickers(allStickers);
    const dups = sorted
      .filter(s => (collection.counts[s.id] || 0) > 1)
      .map(s => ({
        id: s.id,
        name: s.name,
        duplicates: (collection.counts[s.id] || 0) - 1
      }));

    if (format === 'json') {
      const json = JSON.stringify(dups, null, 2);
      try {
        await Share.share({
          title: 'WC26 Album - Duplicates Export',
          text: json,
          dialogTitle: 'Export Duplicates'
        });
      } catch (e) {
        addToast({ type: 'error', text: 'Export failed' });
      }
    } else {
      const list: string[] = [];
      dups.forEach(d => {
        for (let i = 0; i < d.duplicates; i++) {
          list.push(d.id);
        }
      });
      const text = list.join(', ');
      await Clipboard.write({ string: text });
      addToast({ type: 'success', text: 'Duplicates copied to clipboard!' });
    }
    setShowExportDupsModal(false);
  };

  const [collection, setCollection] = useState<CollectionState>(() => {
    const stored = localStorage.getItem('panini_wc26_collection_v2');

    if (stored) {
      try {
        return normalizeCollectionState(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse local collection:', e);
      }
    }

    return generateInitialCollectionState();
  });

  useEffect(() => {
    localStorage.setItem('panini_wc26_collection_v2', JSON.stringify(collection));
  }, [collection]);

  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() => {
    const stored = localStorage.getItem('panini_wc26_activity_log_v1');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse activity log:', e);
      }
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem('panini_wc26_activity_log_v1', JSON.stringify(activityLog));
  }, [activityLog]);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addToast = (msg: { type: 'success' | 'error'; text: string }) => {
    setToast(msg);

    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const updateStickerCount = (
    stickerId: string,
    delta: number,
    comment?: string
  ) => {
    const stickersLookup = new Map<string, Sticker>(allStickers.map(s => [s.id, s]));
    const target = stickersLookup.get(stickerId);

    if (!target) return;

    if (delta < 0) {
      if (!comment) {
        addToast({
          type: 'error',
          text: 'Adjustment Error: A comment is required for all inventory decreases.'
        });
        return;
      }
    }

    setCollection(prev => {
      const next = {
        ...prev,
        counts: { ...(prev.counts ?? {}) }
      };

      const currentVal = next.counts[stickerId] || 0;
      const nextVal = Math.max(0, currentVal + delta);

      next.counts[stickerId] = nextVal;

      if (delta > 0 && currentVal === 0) {
        addToast({
          type: 'success',
          text: `Sweet! Sticked '${target.name}' (${stickerId}) into your album!`
        });
      }

      return next;
    });

    if (delta !== 0 && comment) {
      const newAdjustment: AdjustmentEntry = {
        id: `adj-${Date.now()}-${Math.random()}`,
        type: 'adjustment',
        timestamp: Date.now(),
        stickerId,
        delta,
        comment
      };

      setActivityLog(prev => [newAdjustment, ...prev]);
    }
  };

  const handleQuickAddStickers = (input: string) => {
    const rawTokens = input
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const successes: string[] = [];
    const errors: string[] = [];

    const stickersLookup = new Map<string, Sticker>(allStickers.map(s => [s.id, s]));

    setCollection(prev => {
      const next = {
        ...prev,
        counts: { ...(prev.counts ?? {}) }
      };

      rawTokens.forEach(tok => {
        const cleanId = tok.replace('#', '');
        const target = stickersLookup.get(cleanId);

        if (target) {
          next.counts[cleanId] = (next.counts[cleanId] || 0) + 1;
          successes.push(cleanId);
        } else {
          errors.push(tok);
        }
      });

      return next;
    });

    return { successes, errors };
  };

  const handleQuickRemoveStickers = (input: string, reason: string) => {
    const rawTokens = input
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const successes: string[] = [];
    const errors: string[] = [];
    const blocked: string[] = [];

    const stickersLookup = new Map<string, Sticker>(allStickers.map(s => [s.id, s]));

    setCollection(prev => {
      const next = {
        ...prev,
        counts: { ...(prev.counts ?? {}) }
      };

      rawTokens.forEach(tok => {
        const cleanId = tok.replace('#', '');
        const target = stickersLookup.get(cleanId);

        if (!target) {
          errors.push(tok);
          return;
        }

        const currentCount = next.counts[cleanId] || 0;
        if (currentCount <= 1) {
          // Can't remove a sticker that's pasted in the album (count=1) or not owned (count=0)
          blocked.push(cleanId);
          return;
        }

        next.counts[cleanId] = currentCount - 1;
        successes.push(cleanId);
      });

      return next;
    });

    // Log adjustments for each successful removal
    if (successes.length > 0 && reason) {
      const newAdjustments: AdjustmentEntry[] = successes.map(stickerId => ({
        id: `adj-${Date.now()}-${Math.random()}`,
        type: 'adjustment' as const,
        timestamp: Date.now(),
        stickerId,
        delta: -1,
        comment: reason
      }));

      setActivityLog(prev => [...newAdjustments, ...prev]);
    }

    return { successes, errors, blocked };
  };

  const totalStickersCount = allStickers.length;
  const collectionCounts = collection.counts ?? {};

  const uniqueCollectedCount = Object.keys(collectionCounts).filter(
    id => collectionCounts[id] > 0
  ).length;

  const totalCompletionPercent =
    totalStickersCount > 0
      ? Math.round((uniqueCollectedCount / totalStickersCount) * 105) || 0
      : 0;

  const handleResetCollection = () => {
    if (
      window.confirm(
        'Are you sure you want to completely reset your album collection? This cannot be undone.'
      )
    ) {
      setCollection(generateInitialCollectionState());
      addToast({
        type: 'success',
        text: 'Your collection has been reset.'
      });
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md antialiased md:relative">
      {toast && (
        <div
          id="global-toast"
          className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 transition-opacity duration-300 pointer-events-none ${
            toast.type === 'success'
              ? 'bg-secondary-container text-on-secondary-container border-secondary/35'
              : 'bg-error-container text-on-error-container border-error/35'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-6 h-6 text-secondary animate-bounce" />
          ) : (
            <AlertCircle className="w-6 h-6 text-error" />
          )}
          <span className="font-label-bold text-sm">{toast.text}</span>
        </div>
      )}

      <header className="w-full h-16 sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-outline-variant/60 flex justify-between items-center px-6 lg:pl-80 shadow-sm leading-none select-none">
        <div className="flex items-center gap-4">
          <button
            id="mobile-drawer-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-full hover:bg-surface-container-high transition-all text-primary lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <h1 className="font-display-lg text-lg sm:text-2xl font-black text-primary uppercase tracking-tighter m-0">
            World Cup 2026 Album
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('album');
              setTimeout(() => {
                const searchInput = document.getElementById('search-stickers-input');
                if (searchInput) searchInput.focus();
              }, 100);
            }}
            className="p-2.5 rounded-full hover:bg-surface-container-high transition-all text-on-surface-variant hover:text-on-surface"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      <aside
        id="desktop-sidenav"
        className={`fixed left-0 top-0 bottom-0 h-full w-72 border-r border-outline-variant shadow-sm bg-surface-container-low z-50 transition-transform duration-300 flex flex-col py-8 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 pb-6 border-b border-outline-variant/60 flex flex-col gap-5 shrink-0 select-none">
          <div className="font-display-lg text-3xl font-extrabold text-primary italic tracking-tighter m-0 leading-none">
            ALBUM
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto mt-6">
          <ul className="space-y-1.5 select-none">
            <li>
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setSelectedTeamCode(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-[calc(100%-16px)] mx-2 text-left flex items-center gap-3.5 px-6 py-3.5 font-body-md text-sm rounded-xl transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-primary text-on-primary font-label-bold scale-95 shadow-md shadow-primary/25'
                    : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <Home className="w-5 h-5 shrink-0" />
                <span>Dashboard</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  setActiveTab('album');
                  setSelectedTeamCode(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-[calc(100%-16px)] mx-2 text-left flex items-center gap-3.5 px-6 py-3.5 font-body-md text-sm rounded-xl transition-all ${
                  activeTab === 'album'
                    ? 'bg-primary text-on-primary font-label-bold scale-95 shadow-md shadow-primary/25'
                    : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                <span>My Album</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  setActiveTab('trading');
                  setSelectedTeamCode(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-[calc(100%-16px)] mx-2 text-left flex items-center gap-3.5 px-6 py-3.5 font-body-md text-sm rounded-xl transition-all ${
                  activeTab === 'trading'
                    ? 'bg-primary text-on-primary font-label-bold scale-95 shadow-md shadow-primary/25'
                    : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <ArrowUpDown className="w-5 h-5 shrink-0" />
                <span>Trading Matcher</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  setActiveTab('check');
                  setSelectedTeamCode(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-[calc(100%-16px)] mx-2 text-left flex items-center gap-3.5 px-6 py-3.5 font-body-md text-sm rounded-xl transition-all ${
                  activeTab === 'check'
                    ? 'bg-primary text-on-primary font-label-bold scale-95 shadow-md shadow-primary/25'
                    : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <ClipboardCheck className="w-5 h-5 shrink-0" />
                <span>Sticker Check</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  setActiveTab('needs-matcher');
                  setSelectedTeamCode(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-[calc(100%-16px)] mx-2 text-left flex items-center gap-3.5 px-6 py-3.5 font-body-md text-sm rounded-xl transition-all ${
                  activeTab === 'needs-matcher'
                    ? 'bg-primary text-on-primary font-label-bold scale-95 shadow-md shadow-primary/25'
                    : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <Handshake className="w-5 h-5 shrink-0" />
                <span>Needs Matcher</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  setActiveTab('teams');
                  setSelectedTeamCode(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-[calc(100%-16px)] mx-2 text-left flex items-center gap-3.5 px-6 py-3.5 font-body-md text-sm rounded-xl transition-all ${
                  activeTab === 'teams'
                    ? 'bg-primary text-on-primary font-label-bold scale-95 shadow-md shadow-primary/25'
                    : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                <Flag className="w-5 h-5 shrink-0" />
                <span>Teams</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="px-6 pt-6 border-t border-outline-variant/60 flex flex-col gap-2 shrink-0 select-none">
          <button
            onClick={() => {
              handleResetCollection();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left flex items-center gap-3.5 px-6 py-3.5 font-body-md text-sm rounded-xl transition-all text-error hover:bg-error/10"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Reset Collection</span>
          </button>
        </div>

        <div className="px-5 mt-auto border-t border-outline-variant/60 pt-5 shrink-0">
          <div className="flex flex-col gap-1.5 mt-4 select-none">
            <button
              onClick={handleExportAll}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-variant rounded-xl text-left text-xs font-body-md text-on-surface-variant hover:text-on-surface border-none cursor-pointer outline-none bg-transparent"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Export All (JSON)</span>
            </button>

            <button
              onClick={handleCopyMissingSorted}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-variant rounded-xl text-left text-xs font-body-md text-on-surface-variant hover:text-on-surface border-none cursor-pointer outline-none bg-transparent"
            >
              <Copy className="w-4 h-4 text-secondary" />
              <span>Export Missing</span>
            </button>

            <button
              onClick={() => setShowExportDupsModal(true)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-variant rounded-xl text-left text-xs font-body-md text-on-surface-variant hover:text-on-surface border-none cursor-pointer outline-none bg-transparent"
            >
              <Copy className="w-4 h-4 text-secondary" />
              <span>Export Duplicates</span>
            </button>

            <button
              onClick={() =>
                addToast({
                  type: 'success',
                  text: 'Your credentials are synchronized locally inside localStorage!'
                })
              }
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-variant rounded-xl text-left text-xs font-body-md text-on-surface-variant hover:text-on-surface border-none cursor-pointer outline-none bg-transparent"
            >
              <Settings className="w-4 h-4 text-outline" />
              <span>Settings</span>
            </button>

            <button
              onClick={() =>
                addToast({
                  type: 'success',
                  text: 'FIFA 2026 Collection FAQ: Supported standard Panini metrics.'
                })
              }
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-variant rounded-xl text-left text-xs font-body-md text-on-surface-variant hover:text-on-surface border-none cursor-pointer outline-none bg-transparent"
            >
              <HelpCircle className="w-4 h-4 text-outline" />
              <span>Support Portal</span>
            </button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          id="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/45 backdrop-blur-sm animate-fadeIn"
        />
      )}

      <main className="flex-grow w-full lg:pl-72 p-6 pb-28 lg:pb-12 bg-surface-bright select-none overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full relative z-10 select-none">
          {activeTab === 'dashboard' && (
            <DashboardView
              collection={collection}
              allStickers={allStickers}
              quickAddStickers={handleQuickAddStickers}
              quickRemoveStickers={handleQuickRemoveStickers}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'album' && (
            <MyAlbumView
              collection={collection}
              allStickers={allStickers}
              updateStickerCount={updateStickerCount}
              openTeamDetails={teamCode => {
                setSelectedTeamCode(teamCode);
                setActiveTab('teams');
              }}
            />
          )}

          {activeTab === 'trading' && (
            <TradingView
              collection={collection}
              allStickers={allStickers}
              updateCollectionStateDirectly={setCollection}
              addToast={addToast}
              activityLog={activityLog}
              setActivityLog={setActivityLog}
            />
          )}

          {activeTab === 'check' && (
            <CheckView
              collection={collection}
              allStickers={allStickers}
            />
          )}

          {activeTab === 'needs-matcher' && (
            <NeedsMatcherView
              collection={collection}
              allStickers={allStickers}
            />
          )}

          {activeTab === 'teams' &&
            (selectedTeamCode ? (
              <TeamDetailsView
                team={TEAMS.find(t => t.code === selectedTeamCode)!}
                collection={collection}
                allStickers={allStickers}
                updateStickerCount={updateStickerCount}
                onBack={() => setSelectedTeamCode(null)}
                addToast={addToast}
              />
            ) : (
              <TeamsView
                collection={collection}
                allStickers={allStickers}
                onSelectTeam={setSelectedTeamCode}
                addToast={addToast}
              />
            ))}
        </div>
      </main>

      <nav
        id="mobile-bottom-nav"
        className="flex justify-around items-center h-20 px-4 pb-safe bg-surface-container-highest fixed bottom-0 left-0 right-0 w-full z-40 rounded-t-2xl lg:hidden border-t-2 border-secondary-container shadow-[0_-4px_12px_rgba(0,0,0,0.12)]"
      >
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setSelectedTeamCode(null);
          }}
          className={`flex flex-col items-center justify-center py-2 text-on-surface-variant transition-transform w-1/6 outline-none bg-transparent border-none ${
            activeTab === 'dashboard' ? 'text-primary' : 'hover:text-on-surface'
          }`}
        >
          <Home
            className={`w-5.5 h-5.5 mb-1 ${
              activeTab === 'dashboard' ? 'text-primary fill-current' : ''
            }`}
          />
          <span className="font-label-bold text-[10px] tracking-tight">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('album');
            setSelectedTeamCode(null);
          }}
          className={`flex flex-col items-center justify-center py-2 text-on-surface-variant transition-transform w-1/6 outline-none bg-transparent border-none ${
            activeTab === 'album' ? 'text-primary' : 'hover:text-on-surface'
          }`}
        >
          <BookOpen
            className={`w-5.5 h-5.5 mb-1 ${
              activeTab === 'album' ? 'text-primary fill-current' : ''
            }`}
          />
          <span className="font-label-bold text-[10px] tracking-tight">Album</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('trading');
            setSelectedTeamCode(null);
          }}
          className={`flex flex-col items-center justify-center text-on-secondary-container rounded-full px-5 py-2 w-1/6 outline-none border-none animate-pulse ${
            activeTab === 'trading'
              ? 'bg-primary text-on-primary shadow-lg ring-4 ring-primary-container/30'
              : 'bg-secondary-container'
          }`}
        >
          <ArrowUpDown className="w-5.5 h-5.5" />
          <span className="font-label-bold text-[10px] tracking-tight mt-0.5">Trade</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('check');
            setSelectedTeamCode(null);
          }}
          className={`flex flex-col items-center justify-center py-2 text-on-surface-variant transition-transform w-1/6 outline-none bg-transparent border-none ${
            activeTab === 'check' ? 'text-primary' : 'hover:text-on-surface'
          }`}
        >
          <ClipboardCheck
            className={`w-5.5 h-5.5 mb-1 ${
              activeTab === 'check' ? 'text-primary fill-current' : ''
            }`}
          />
          <span className="font-label-bold text-[10px] tracking-tight">Check</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('needs-matcher');
            setSelectedTeamCode(null);
          }}
          className={`flex flex-col items-center justify-center py-2 text-on-surface-variant transition-transform w-1/6 outline-none bg-transparent border-none ${
            activeTab === 'needs-matcher' ? 'text-primary' : 'hover:text-on-surface'
          }`}
        >
          <Handshake
            className={`w-5.5 h-5.5 mb-1 ${
              activeTab === 'needs-matcher' ? 'text-primary fill-current' : ''
            }`}
          />
          <span className="font-label-bold text-[10px] tracking-tight">Match</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('teams');
            setSelectedTeamCode(null);
          }}
          className={`flex flex-col items-center justify-center py-2 text-on-surface-variant transition-transform w-1/6 outline-none bg-transparent border-none ${
            activeTab === 'teams' ? 'text-primary' : 'hover:text-on-surface'
          }`}
        >
          <Flag
            className={`w-5.5 h-5.5 mb-1 ${
              activeTab === 'teams' ? 'text-primary fill-current' : ''
            }`}
          />
          <span className="font-label-bold text-[10px] tracking-tight">Teams</span>
        </button>
      </nav>

      {showExportDupsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExportDupsModal(false)} />
          <div className="relative bg-surface-container-low border border-outline-variant rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display-lg text-xl font-bold text-on-surface mb-2">Export Duplicates</h3>
            <p className="font-body-md text-sm text-on-surface-variant mb-8">
              Choose your preferred format for exporting your duplicate stickers.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleExportDuplicates('json')}
                className="flex items-center justify-center gap-3 w-full bg-surface-container-high hover:bg-surface-variant text-on-surface py-4 rounded-2xl font-label-bold transition-all border border-outline-variant/30"
              >
                <FileJson className="w-5 h-5 text-primary" />
                Export as JSON
              </button>
              
              <button
                onClick={() => handleExportDuplicates('clipboard')}
                className="flex items-center justify-center gap-3 w-full bg-primary text-on-primary py-4 rounded-2xl font-label-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <Copy className="w-5 h-5" />
                Copy to Clipboard
              </button>
              
              <button
                onClick={() => setShowExportDupsModal(false)}
                className="w-full text-center py-2 text-xs font-label-bold text-on-surface-variant hover:text-on-surface mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}