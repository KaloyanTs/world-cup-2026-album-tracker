/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CollectionState, Sticker } from '../types';
import { 
  Sparkles, 
  Layers, 
  Repeat, 
  PlusCircle, 
  Truck, 
  CheckCircle,
  Gift,
  ArrowUpDown
} from 'lucide-react';

interface DashboardViewProps {
  collection: CollectionState;
  allStickers: Sticker[];
  quickAddStickers: (input: string) => { successes: string[]; errors: string[] };
  pendingArrivals: Array<{ id: string; stickerId: string; title: string; subtitle: string; rarityColor: string }>;
  confirmArrival: (arrivalId: string, stickerId: string) => void;
  setActiveTab: (tab: string) => void;
}

export function DashboardView({
  collection,
  allStickers,
  quickAddStickers,
  pendingArrivals,
  confirmArrival,
  setActiveTab
}: DashboardViewProps) {
  const [quickAddVal, setQuickAddVal] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Math Calculations
  const totalStickers = allStickers.length;
  const uniqueCollected = Object.keys(collection.counts).filter(id => collection.counts[id] > 0).length;
  const completionPercentage = Math.round((uniqueCollected / totalStickers) * 100);
  const neededStickers = totalStickers - uniqueCollected;

  // Calculate duplicates
  const totalOwned = Object.values(collection.counts).reduce((acc, curr) => acc + (curr as number), 0);
  const duplicatesCount = Object.values(collection.counts).reduce((acc, curr) => {
    return acc + ((curr as number) > 1 ? (curr as number) - 1 : 0);
  }, 0);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddVal.trim()) return;

    const result = quickAddStickers(quickAddVal);
    if (result.successes.length > 0) {
      setToastMessage({
        type: 'success',
        text: `Successfully added: ${result.successes.join(', ')}`
      });
      setQuickAddVal('');
    } else if (result.errors.length > 0) {
      setToastMessage({
        type: 'error',
        text: `Unrecognized sticker codes: ${result.errors.join(', ')}`
      });
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div id="dashboard-tab" className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Toast Feedback */}
      {toastMessage && (
        <div 
          id="toast-notification"
          className={`fixed top-24 right-4 z-50 px-6 py-3 rounded-xl shadow-xl border flex items-center gap-3 transition-opacity duration-300 ${
            toastMessage.type === 'success' 
              ? 'bg-secondary-container text-on-secondary-container border-secondary/30' 
              : 'bg-error-container text-on-error-container border-error/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-secondary animate-bounce" />
          ) : (
            <span className="material-symbols-outlined text-error">warning</span>
          )}
          <span className="font-label-bold text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Bento grid section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Progress Hero Card */}
        <div id="main-progress-card" className="md:col-span-2 bg-gradient-to-br from-primary via-primary-container to-surface-tint text-on-primary rounded-[32px] p-8 lg:p-12 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-lg">
          {/* Decorative Soccer Pattern */}
          <div className="absolute inset-x-0 bottom-0 top-0 opacity-15 mix-blend-overlay bg-no-repeat bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80')` }} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-label-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-secondary-fixed animate-spin" />
              Official Tracker Active
            </div>
            <h2 className="font-display-lg text-display-lg lg:text-3xl font-extrabold tracking-tight mb-2">Total Album Progress</h2>
            <p className="font-body-lg text-body-lg opacity-80 max-w-md">
              You're making great progress! Keep collecting and trading to complete the FIFA World Cup 2026™ collection.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-6 mt-8">
            <div className="text-6-xl lg:text-5-xl font-black text-white hover:scale-105 transition-transform duration-300 leading-none">
              {completionPercentage}%
            </div>
            <div className="flex flex-col gap-2 flex-1 pb-2">
              <div className="flex justify-between font-label-bold text-sm text-primary-fixed">
                <span>{uniqueCollected} / {totalStickers} Collected</span>
                <span>{neededStickers} Needed</span>
              </div>
              <div className="h-4 bg-[#1f2aa0] rounded-full overflow-hidden w-full border border-primary-fixed-dim/30 relative">
                <div 
                  className="h-full bg-gradient-to-r from-secondary-fixed to-secondary-fixed-dim rounded-full shadow-[0_0_12px_rgba(187,244,103,0.7)] transition-all duration-1000" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats columns */}
        <div id="quick-stats-container" className="flex flex-col justify-between gap-6">
          <div id="stat-owned" className="bg-surface-container-lowest border border-outline-variant p-6 rounded-[24px] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">Total Stickers Owned</p>
              <p className="font-display-lg text-3xl font-black text-on-surface mt-1">{totalOwned}</p>
              <p className="text-xs text-on-surface-variant mt-1 font-body-md">{uniqueCollected} unique + {duplicatesCount} dups</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div id="stat-duplicates" className="bg-surface-container-lowest border border-outline-variant p-6 rounded-[24px] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">Duplicates (Repeats)</p>
              <p className="font-display-lg text-3xl font-black text-tertiary mt-1">{duplicatesCount}</p>
              <p className="text-xs text-on-surface-variant mt-1 font-body-md">Eligible for community swap-trades</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center shadow-inner">
              <Repeat className="w-6 h-6 text-on-tertiary-fixed-variant" />
            </div>
          </div>

          <button 
            id="trade-dup-button" 
            onClick={() => setActiveTab('trading')}
            className="bg-secondary-container text-on-secondary-container font-label-bold py-4 rounded-[24px] border-b-4 border-on-secondary-container hover:bg-secondary hover:text-on-secondary active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            <ArrowUpDown className="w-5 h-5 animate-pulse" />
            Trade Duplicates ({duplicatesCount} Available)
          </button>
        </div>
      </section>

      {/* Inputs & Pending Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Add Stickers Box */}
        <div id="quick-add-section" className="bg-surface-container-low p-6 lg:p-8 rounded-[32px] border border-outline-variant shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface">Quick Add Stickers</h3>
            </div>
            <p className="font-body-md text-sm text-on-surface-variant mb-6 leading-relaxed">
              Found a new sticker? Enter their individual codes separated by commas (supports multiple, duplicates, e.g. <span className="font-mono bg-surface-container px-1 py-0.5 rounded text-xs">00, ARG-10, FWC-5, MEX-1</span>) to update your album instantly.
            </p>
          </div>
          
          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-3">
            <input 
              id="quick-add-input"
              value={quickAddVal}
              onChange={(e) => setQuickAddVal(e.target.value)}
              className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline font-body-md" 
              placeholder="e.g. 00, ARG-10, MEX-3, FWC-7" 
              type="text"
            />
            <button 
              id="quick-add-submit"
              type="submit"
              className="bg-primary hover:bg-surface-tint text-on-primary font-label-bold px-6 py-3 rounded-xl active:scale-95 transition-all whitespace-nowrap text-sm"
            >
              Add to Collection
            </button>
          </form>
        </div>

        {/* Pending Arrivals Box */}
        <div id="pending-arrivals-section" className="bg-surface-container-low p-6 lg:p-8 rounded-[32px] border border-outline-variant shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-secondary/10 p-2.5 rounded-full text-secondary">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">Pending Arrivals</h3>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] scrollbar-hide pr-1">
            {pendingArrivals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-on-surface-variant h-full">
                <span className="material-symbols-outlined text-4xl text-outline opacity-40 mb-2">local_shipping</span>
                <p className="font-label-bold text-sm text-outline">No pending shipments</p>
                <p className="text-xs text-outline mt-1 px-4 font-body-md">Use the trading matcher to propose card exchanges with NPCs.</p>
              </div>
            ) : (
              pendingArrivals.map((arrival) => (
                <div 
                  id={`arrival-${arrival.id}`}
                  key={arrival.id} 
                  className="flex items-center justify-between p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant hover:border-outline shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-14 ${arrival.rarityColor} rounded-lg flex items-center justify-center font-label-bold text-xs shadow-inner shrink-0 leading-none`}>
                      {arrival.stickerId}
                    </div>
                    <div>
                      <p className="font-label-bold text-sm text-on-surface">{arrival.title}</p>
                      <p className="text-xs text-on-surface-variant font-body-md">{arrival.subtitle}</p>
                    </div>
                  </div>
                  <button 
                    id={`confirm-arrival-btn-${arrival.id}`}
                    onClick={() => confirmArrival(arrival.id, arrival.stickerId)}
                    className="text-primary hover:bg-primary/5 p-2 rounded-lg flex items-center gap-1 transition-all font-label-bold text-xs shrink-0"
                  >
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Confirm Receipt
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
