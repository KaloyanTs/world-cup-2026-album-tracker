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

import {
  Home,
  BookOpen,
  ArrowUpDown,
  Flag,
  Bell,
  Search,
  Settings,
  HelpCircle,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';

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
    photos:
      parsed.photos && typeof parsed.photos === 'object'
        ? parsed.photos
        : fallback.photos ?? {},
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allStickers = useMemo(() => generateAllStickers(), []);

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

  const [pendingArrivals, setPendingArrivals] = useState<
    Array<{
      id: string;
      stickerId: string;
      title: string;
      subtitle: string;
      rarityColor: string;
    }>
  >(() => {
    const stored = localStorage.getItem('panini_wc26_pending_arrivals_v2');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse pending arrivals:', e);
      }
    }

    return [
      {
        id: 'arr-1',
        stickerId: 'ARG-10',
        title: 'Lionel Messi',
        subtitle: 'Trade from @Alex88',
        rarityColor:
          'bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-tertiary text-tertiary-container'
      },
      {
        id: 'arr-2',
        stickerId: 'ENG-10',
        title: 'Bukayo Saka',
        subtitle: 'Trade from @KylianFan',
        rarityColor: 'bg-surface-dim text-on-surface-variant'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('panini_wc26_pending_arrivals_v2', JSON.stringify(pendingArrivals));
  }, [pendingArrivals]);

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
    comment?: string,
    photoUrl?: string
  ) => {
    const stickersLookup = new Map<string, Sticker>(allStickers.map(s => [s.id, s]));
    const target = stickersLookup.get(stickerId);

    if (!target) return;

    if (delta < 0) {
      const currentCount = collection.counts?.[stickerId] || 0;

      if (currentCount <= 1 && currentCount > 0) {
        addToast({
          type: 'error',
          text: 'Rules Violation: Once a sticker is in your album, you cannot remove it!'
        });
        return;
      }

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
        counts: { ...(prev.counts ?? {}) },
        photos: { ...(prev.photos ?? {}) }
      };

      const currentVal = next.counts[stickerId] || 0;
      const nextVal = Math.max(0, currentVal + delta);

      next.counts[stickerId] = nextVal;

      if (photoUrl && !next.photos[stickerId]) {
        next.photos[stickerId] = photoUrl;
      }

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

  const saveStickerPhoto = (stickerId: string, photoUrl: string) => {
    setCollection(prev => {
      const next = {
        ...prev,
        counts: { ...(prev.counts ?? {}) },
        photos: { ...(prev.photos ?? {}) }
      };

      if (next.photos[stickerId]) {
        addToast({
          type: 'error',
          text: "A photo for this sticker already exists and can't be replaced!"
        });
        return prev;
      }

      next.photos[stickerId] = photoUrl;
      return next;
    });

    addToast({ type: 'success', text: 'Photo captured and saved to your album!' });
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
        counts: { ...(prev.counts ?? {}) },
        photos: { ...(prev.photos ?? {}) }
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

  const addArrivalSticker = (stickerId: string, traderName: string) => {
    const stickersLookup = new Map<string, Sticker>(allStickers.map(s => [s.id, s]));
    const s = stickersLookup.get(stickerId);

    if (!s) return;

    const newArr = {
      id: `arr-${Date.now()}-${Math.random()}`,
      stickerId,
      title: s.name,
      subtitle: `Swapped with ${traderName}`,
      rarityColor: s.isShiny
        ? 'bg-gradient-to-b from-amber-50 to-amber-100 text-tertiary-container border border-tertiary'
        : 'bg-surface-dim text-on-surface-variant'
    };

    setPendingArrivals(prev => [newArr, ...prev]);
  };

  const confirmArrivalReceipt = (arrivalId: string, stickerId: string) => {
    setCollection(prev => {
      const next = {
        ...prev,
        counts: { ...(prev.counts ?? {}) },
        photos: { ...(prev.photos ?? {}) }
      };

      next.counts[stickerId] = (next.counts[stickerId] || 0) + 1;

      return next;
    });

    setPendingArrivals(prev => prev.filter(a => a.id !== arrivalId));

    const stickersLookup = new Map<string, Sticker>(allStickers.map(s => [s.id, s]));
    const s = stickersLookup.get(stickerId);

    addToast({
      type: 'success',
      text: `Shipment received! Sticked ${s?.name || stickerId} directly into your album!`
    });
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
      setPendingArrivals([]);
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
          className={`fixed top-24 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 transition-opacity duration-300 pointer-events-none ${
            toast.type === 'success'
              ? 'bg-secondary-container text-on-secondary-container border-secondary/35'
              : 'bg-error-container text-on-error-container border-error/35'
          }`}
        >
          {toast.type === 'success' ? (
            <span className="material-symbols-outlined text-secondary animate-bounce">
              check_circle
            </span>
          ) : (
            <span className="material-symbols-outlined text-error">warning</span>
          )}
          <span className="font-label-bold text-sm">{toast.text}</span>
        </div>
      )}

      <header className="w-full h-20 sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-outline-variant/60 flex justify-between items-center px-6 lg:pl-80 shadow-sm leading-none select-none">
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

          <button
            onClick={() => {
              setActiveTab('dashboard');
              addToast({
                type: 'success',
                text: 'Your trading pipeline is healthy. No new alerts.'
              });
            }}
            className="p-2.5 rounded-full hover:bg-surface-container-high transition-all text-on-surface-variant hover:text-on-surface relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
          </button>

          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border-2 border-primary ml-2 select-all shadow-inner">
            <img
              alt="Collector Avatar"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMkBDm1WZc-ihUAp0uniKnMwhg2lnQOtYe9WRfgvHN0gdvikRehMSMsa6GgbcbRKMTjWpIZN8uUUn2pFou1NXsMRA2ozELjQ5h9WLORNzTe1Hh7YDYJaue7J4yK1IhQYBTtsDR0UAIkzcTHMPPDZnlDUXtJIloBtOTok_eXK-fVWdKSj0rIFUMJ4bOZQ0SUhGooZa_-wvk1w7TM4VtEEut707O0LX89irFkgt34m-u-9qj5zLp6jERT_UGZUeE8fp8V5z_-SZQRCkV"
            />
          </div>
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

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border-2 border-primary overflow-hidden shrink-0 shadow-inner">
              <img
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhTkWznc3dLB34CLgJarl_cMpPXVmBFUZeGA50KOqdCwqmuX9krMVQa2GP_prr_9CH55qEgslfvoJwrPdTl6nXrkZr04SWaX-inAsL_NMJFdACLQza9jRx_c3I8TWgoBzVANcylL45gfPk4HDdVNvj5jRvAfeBc6BP-35WJ7fh5hQ-tZI4-AXGkG_VB_SXOTibbtQgEoTMRdj18bPJVJBzk0jWfHDmtOCQe5X6Fdl5scECw7RT0a8pe7L6Swj8ocTn9XU1KvqDTij_"
              />
            </div>
            <div className="min-w-0">
              <p className="font-headline-md text-sm sm:text-base font-bold text-on-surface truncate leading-tight">
                Collector Profile
              </p>
              <p className="text-[11px] text-on-surface-variant font-body-md truncate mt-0.5">
                Elite Collector #2026
              </p>
            </div>
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
              pendingArrivals={pendingArrivals}
              confirmArrival={confirmArrivalReceipt}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'album' && (
            <MyAlbumView
              collection={collection}
              allStickers={allStickers}
              updateStickerCount={updateStickerCount}
              saveStickerPhoto={saveStickerPhoto}
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

          {activeTab === 'teams' &&
            (selectedTeamCode ? (
              <TeamDetailsView
                team={TEAMS.find(t => t.code === selectedTeamCode)!}
                collection={collection}
                allStickers={allStickers}
                updateStickerCount={updateStickerCount}
                saveStickerPhoto={saveStickerPhoto}
                onBack={() => setSelectedTeamCode(null)}
              />
            ) : (
              <TeamsView
                collection={collection}
                allStickers={allStickers}
                onSelectTeam={setSelectedTeamCode}
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
          className={`flex flex-col items-center justify-center py-2 text-on-surface-variant transition-transform w-1/4 outline-none bg-transparent border-none ${
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
          className={`flex flex-col items-center justify-center py-2 text-on-surface-variant transition-transform w-1/4 outline-none bg-transparent border-none ${
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
          className={`flex flex-col items-center justify-center text-on-secondary-container rounded-full px-5 py-2 w-1/4 outline-none border-none animate-pulse ${
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
            setActiveTab('teams');
            setSelectedTeamCode(null);
          }}
          className={`flex flex-col items-center justify-center py-2 text-on-surface-variant transition-transform w-1/4 outline-none bg-transparent border-none ${
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
    </div>
  );
}