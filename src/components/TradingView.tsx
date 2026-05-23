/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { CollectionState, Sticker } from '../types';
import { 
  ArrowLeftRight, 
  User, 
  Sparkles,
  Info,
  Calendar,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Plus,
  Search
} from 'lucide-react';

export interface ManualSwap {
  id: string;
  type: 'swap';
  timestamp: number;
  personName: string;
  gaveStickers: string[];
  receivedStickers: string[];
  comment?: string;
}

export interface AdjustmentEntry {
  id: string;
  type: 'adjustment';
  timestamp: number;
  stickerId: string;
  delta: number;
  comment: string;
}

export type ActivityEntry = ManualSwap | AdjustmentEntry;

interface TradingViewProps {
  collection: CollectionState;
  allStickers: Sticker[];
  updateCollectionStateDirectly: React.Dispatch<React.SetStateAction<CollectionState>>;
  addToast: (msg: { type: 'success' | 'error'; text: string }) => void;
  activityLog: ActivityEntry[];
  setActivityLog: React.Dispatch<React.SetStateAction<ActivityEntry[]>>;
}

export function TradingView({
  collection,
  allStickers,
  updateCollectionStateDirectly,
  addToast,
  activityLog,
  setActivityLog
}: TradingViewProps) {
  // Inputs
  const [personName, setPersonName] = useState('');
  const [gaveInput, setGaveInput] = useState('');
  const [receivedInput, setReceivedInput] = useState('');
  const [swapComment, setSwapComment] = useState('');
  const [bypassChecks, setBypassChecks] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Sticker ID lookup helper
  const stickersMap = useMemo(() => {
    const map = new Map<string, Sticker>();
    for (const s of allStickers) {
      map.set(s.id, s);
    }
    return map;
  }, [allStickers]);

  // Filtered and Sorted log
  const filteredLog = useMemo(() => {
    let result = [...activityLog];

    // Search filter
    if (logSearchQuery.trim()) {
      const query = logSearchQuery.toLowerCase();
      result = result.filter(entry => {
        if (entry.type === 'swap') {
          return (
            entry.personName.toLowerCase().includes(query) ||
            entry.gaveStickers.some(id => id.toLowerCase().includes(query)) ||
            entry.receivedStickers.some(id => id.toLowerCase().includes(query)) ||
            (entry.comment && entry.comment.toLowerCase().includes(query))
          );
        } else {
          return (
            entry.stickerId.toLowerCase().includes(query) ||
            entry.comment.toLowerCase().includes(query)
          );
        }
      });
    }

    // Sort by most recent
    result.sort((a, b) => b.timestamp - a.timestamp);

    return result;
  }, [activityLog, logSearchQuery]);

  // Clean parse text codes (e.g. "FWC-7, MEX-10" -> ["FWC-7", "MEX-10"])
  const cleanParseInput = (input: string): string[] => {
    return input
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0 && stickersMap.has(s));
  };

  // Find invalid sticker inputs
  const getInvalidStickers = (input: string): string[] => {
    if (!input.trim()) return [];
    return input
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0 && !stickersMap.has(s));
  };

  // Check which stickers in user "gave" list are not owned
  const getMissingGaveStickers = (input: string): string[] => {
    const parsed = cleanParseInput(input);
    return parsed.filter(id => {
      const owned = collection.counts[id] || 0;
      return owned < 1;
    });
  };

  // Check which stickers in user "gave" list are sole copies (owned === 1)
  const getSoloGaveStickers = (input: string): string[] => {
    const parsed = cleanParseInput(input);
    return parsed.filter(id => {
      const owned = collection.counts[id] || 0;
      return owned === 1;
    });
  };

  // Quick add helpers
  const handleAddGaveCode = (code: string) => {
    const current = gaveInput.trim();
    if (!current) {
      setGaveInput(code);
    } else {
      const parsed = current.split(',').map(s => s.trim());
      if (!parsed.includes(code)) {
        setGaveInput(current + ', ' + code);
      }
    }
  };

  const handleAddReceivedCode = (code: string) => {
    const current = receivedInput.trim();
    if (!current) {
      setReceivedInput(code);
    } else {
      const parsed = current.split(',').map(s => s.trim());
      if (!parsed.includes(code)) {
        setReceivedInput(current + ', ' + code);
      }
    }
  };

  // Get active user duplicates for quick-pills helper (items where count > 1)
  const userDuplicates = useMemo(() => {
    return allStickers
      .filter(s => (collection.counts[s.id] || 0) > 1)
      .slice(0, 15);
  }, [allStickers, collection]);

  // Get active user missing for quick-pills helper (items where count === 0)
  const userMissing = useMemo(() => {
    return allStickers
      .filter(s => (collection.counts[s.id] || 0) === 0)
      .slice(0, 15);
  }, [allStickers, collection]);

  // Parse list of valid stickers typed
  const parsedGaveList = useMemo(() => cleanParseInput(gaveInput), [gaveInput, stickersMap]);
  const parsedReceivedList = useMemo(() => cleanParseInput(receivedInput), [receivedInput, stickersMap]);

  // Get details for invalid codes
  const invalidGaveList = useMemo(() => getInvalidStickers(gaveInput), [gaveInput]);
  const invalidReceivedList = useMemo(() => getInvalidStickers(receivedInput), [receivedInput]);

  // Get list of gave stickers you don't even own
  const missingGaveList = useMemo(() => getMissingGaveStickers(gaveInput), [gaveInput, collection]);
  // Get list of gave stickers that are your only copy
  const soloGaveList = useMemo(() => getSoloGaveStickers(gaveInput), [gaveInput, collection]);

  const handleRecordSwap = (e: React.FormEvent) => {
    e.preventDefault();

    if (!personName.trim()) {
      addToast({ type: 'error', text: "Please enter the person's name to record." });
      return;
    }

    const gave = cleanParseInput(gaveInput);
    const received = cleanParseInput(receivedInput);

    if (gave.length === 0 && received.length === 0) {
      addToast({ type: 'error', text: 'Enter at least one valid sticker ID that was swapped.' });
      return;
    }

    if (!bypassChecks) {
      const missing = getMissingGaveStickers(gaveInput);
      if (missing.length > 0) {
        addToast({
          type: 'error',
          text: `You don't own these stickers to give: ${missing.join(', ')}`
        });
        return;
      }

      const solo = getSoloGaveStickers(gaveInput);
      if (solo.length > 0) {
        addToast({
          type: 'error',
          text: `Rules Violation: You cannot trade your only copy of: ${solo.join(', ')} (it's in your album!)`
        });
        return;
      }

      if (gave.length > 0 && !swapComment.trim()) {
        addToast({
          type: 'error',
          text: `Adjustment Error: A comment is required for all inventory decreases.`
        });
        return;
      }
    }

    // Apply updates to the state
    updateCollectionStateDirectly((current) => {
      const next = { ...current };
      
      // Deduct stickers given
      gave.forEach(id => {
        if (next[id] > 0) {
          next[id]--;
        }
      });

      // Add stickers received
      received.forEach(id => {
        next[id] = (next[id] || 0) + 1;
      });

      return next;
    });

    // Record the swap
    const newSwap: ManualSwap = {
      id: `swap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'swap',
      timestamp: Date.now(),
      personName: personName.trim(),
      gaveStickers: gave,
      receivedStickers: received,
      comment: swapComment.trim() || undefined
    };

    setActivityLog(prev => [newSwap, ...prev]);

    // Reset inputs
    setPersonName('');
    setGaveInput('');
    setReceivedInput('');
    setSwapComment('');

    addToast({
      type: 'success',
      text: `Successfully logged swap with ${newSwap.personName}! Inventory synced.`
    });
  };

  const handleUndoSwap = (entry: ActivityEntry) => {
    // Check if undoing would violate the no-unsticking rule
    if (entry.type === 'swap') {
      const wouldUnstick = entry.receivedStickers.filter(id => (collection.counts[id] || 0) === 1);
      if (wouldUnstick.length > 0) {
        addToast({
          type: 'error',
          text: `Cannot undo: You've already sticked these into your album: ${wouldUnstick.join(', ')}`
        });
        return;
      }
    } else {
      if (entry.delta > 0 && (collection.counts[entry.stickerId] || 0) === 1) {
        addToast({
          type: 'error',
          text: `Cannot undo: ${entry.stickerId} is already sticked in your album!`
        });
        return;
      }
    }

    // Revert inventory
    updateCollectionStateDirectly((current) => {
      const next = { ...current };
      next.counts = { ...next.counts };

      if (entry.type === 'swap') {
        // Add back stickers we gave
        entry.gaveStickers.forEach(id => {
          next.counts[id] = (next.counts[id] || 0) + 1;
        });

        // Deduct stickers we received
        entry.receivedStickers.forEach(id => {
          if (next.counts[id] > 0) {
            next.counts[id]--;
          }
        });
      } else {
        // Reverse adjustment
        const { stickerId, delta } = entry;
        next.counts[stickerId] = Math.max(0, (next.counts[stickerId] || 0) - delta);
      }

      return next;
    });

    // Remove entry from state
    setActivityLog(prev => prev.filter(s => s.id !== entry.id));

    addToast({
      type: 'success',
      text: `Entry reverted. Album inventory updated!`
    });
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div id="trading-tab" className="max-w-4xl mx-auto w-full flex flex-col gap-8 pb-12 select-none">
      <div id="trading-header">
        <h2 className="font-display-lg text-3xl font-extrabold text-primary mb-2 flex items-center gap-2">
          <ArrowLeftRight className="w-8 h-8 text-primary" />
          Album Swap Room
        </h2>
        <p className="text-on-surface-variant font-body-lg text-sm sm:text-base leading-relaxed">
          Record physical sticker trades or direct swaps conducted in person. Simply specify the person you traded with, list what stickers you parted with, and list what you brought home to keep your digital companion ledger impeccably aligned.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2/3: Form Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div id="manual-swap-form-container" className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-6">
            <h3 className="font-headline-md text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              Log Manual Swap
            </h3>

            <form onSubmit={handleRecordSwap} className="flex flex-col gap-5">
              {/* Person's Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wide">
                  Person's Name <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input 
                    id="swap-person-name"
                    type="text"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. Kaloyan"
                    maxLength={50}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline"
                  />
                </div>
              </div>

              {/* Grid: What they got (We gave) & What we got (They gave) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* We Gave */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wide">
                    Stickers You Gave Them
                  </label>
                  <p className="text-[11px] text-on-surface-variant">Comma-separated sticker IDs</p>
                  <input 
                    id="swap-stickers-gave"
                    type="text"
                    value={gaveInput}
                    onChange={(e) => setGaveInput(e.target.value)}
                    placeholder="e.g. ARG-10, ESP-4"
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-mono text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:font-sans placeholder:text-outline"
                  />

                  {/* Duplicate Quick-Pills Helper */}
                  {userDuplicates.length > 0 && (
                    <div className="mt-2 text-[11px] text-on-surface-variant">
                      <span className="font-semibold block mb-1">Click duplicates to add:</span>
                      <div className="flex flex-wrap gap-1 max-h-[75px] overflow-y-auto pr-1">
                        {userDuplicates.map(s => (
                          <button
                            id={`quick-duplicate-pill-${s.id}`}
                            key={s.id}
                            type="button"
                            onClick={() => handleAddGaveCode(s.id)}
                            className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-mono hover:bg-secondary hover:text-on-secondary transition-colors"
                          >
                            +{s.id} ({collection.counts[s.id]}x)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* We Received */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wide">
                    Stickers You Received
                  </label>
                  <p className="text-[11px] text-on-surface-variant font-body-md">Comma-separated sticker IDs</p>
                  <input 
                    id="swap-stickers-received"
                    type="text"
                    value={receivedInput}
                    onChange={(e) => setReceivedInput(e.target.value)}
                    placeholder="e.g. FWC-7, USA-5"
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-mono text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:font-sans placeholder:text-outline"
                  />

                  {/* Needed Quick-Pills Helper */}
                  {userMissing.length > 0 && (
                    <div className="mt-2 text-[11px] text-on-surface-variant">
                      <span className="font-semibold block mb-1">Click needed to add:</span>
                      <div className="flex flex-wrap gap-1 max-h-[75px] overflow-y-auto pr-1">
                        {userMissing.map(s => (
                          <button
                            id={`quick-needed-pill-${s.id}`}
                            key={s.id}
                            type="button"
                            onClick={() => handleAddReceivedCode(s.id)}
                            className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-[10px] font-mono hover:bg-primary hover:text-on-primary transition-colors"
                          >
                            +{s.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Swap Explanation / Comment */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wide">
                  Swap Explanation / Comment {parsedGaveList.length > 0 && <span className="text-[#ba1a1a]">*</span>}
                </label>
                <textarea
                  id="swap-comment"
                  value={swapComment}
                  onChange={(e) => setSwapComment(e.target.value)}
                  placeholder={parsedGaveList.length > 0 ? "Explain why you're parting with these duplicates (Required)..." : "Optional note about this swap..."}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline resize-none"
                />
              </div>

              {/* Live Preview / Input validation feedback */}
              {(parsedGaveList.length > 0 || parsedReceivedList.length > 0 || invalidGaveList.length > 0 || invalidReceivedList.length > 0) && (
                <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex flex-col gap-3 font-body-md text-xs">
                  <h4 className="font-semibold text-on-surface uppercase tracking-wider text-[10px] text-outline">Swap Validation Ledger:</h4>
                  
                  {/* Validation: You Gave validation and ownership state */}
                  {parsedGaveList.length > 0 && (
                    <div>
                      <p className="font-semibold text-on-surface mb-1">Giving:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {parsedGaveList.map(id => {
                          const s = stickersMap.get(id);
                          const ownedCount = collection.counts[id] || 0;
                          const hasDuplicate = ownedCount > 1;
                          
                          return (
                            <li id={`live-validation-gave-${id}`} key={id} className="text-on-surface-variant">
                              <span className="font-semibold font-mono">{id}</span> ({s?.name}) — 
                              {ownedCount === 0 ? (
                                <span className="text-error font-semibold ml-1">Error: You do not own this sticker!</span>
                              ) : !hasDuplicate ? (
                                <span className="text-amber-600 font-semibold ml-1">Warning: Last copy! Album slot will become empty.</span>
                              ) : (
                                <span className="text-[#476d00] font-semibold ml-1">Ready to trade (Count: {ownedCount})</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Validation: You Received validation */}
                  {parsedReceivedList.length > 0 && (
                    <div>
                      <p className="font-semibold text-on-surface mb-1">Receiving:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {parsedReceivedList.map(id => {
                          const s = stickersMap.get(id);
                          const isNeeded = (collection.counts[id] || 0) === 0;
                          
                          return (
                            <li id={`live-validation-received-${id}`} key={id} className="text-on-surface-variant">
                              <span className="font-semibold font-mono">{id}</span> ({s?.name}) — 
                              {isNeeded ? (
                                <span className="text-secondary font-semibold ml-1">Needed! Will fill album slot.</span>
                              ) : (
                                <span className="text-on-surface-variant ml-1">Duplicate addition (+1 copy)</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Errors: Invalid sticker codes */}
                  {(invalidGaveList.length > 0 || invalidReceivedList.length > 0) && (
                    <div className="text-error font-semibold flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div>
                        {invalidGaveList.length > 0 && <p>Invalid codes in Gave: {invalidGaveList.join(', ')}</p>}
                        {invalidReceivedList.length > 0 && <p>Invalid codes in Received: {invalidReceivedList.join(', ')}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Extra Check: Allow Bypass inventory checks */}
              <div className="flex items-center gap-2">
                <input 
                  id="swap-bypass-inventory"
                  type="checkbox"
                  checked={bypassChecks}
                  onChange={(e) => setBypassChecks(e.target.checked)}
                  className="rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <label htmlFor="swap-bypass-inventory" className="text-on-surface-variant text-xs font-medium cursor-pointer flex items-center gap-1">
                  Bypass inventory validation check
                  <span title="Enable to log swaps of cards even if they do not exist in your digital inventory yet.">
                    <HelpCircle className="w-3 h-3 text-outline" />
                  </span>
                </label>
              </div>

              {/* Submit Action */}
              <button 
                id="record-swap-submit-btn"
                type="submit"
                className="w-full bg-primary text-on-primary font-label-bold py-3 px-6 rounded-full shadow-md hover:bg-surface-tint active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm select-none"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Record & Commit Swap
              </button>
            </form>
          </div>
        </div>

        {/* Right 1/3: Help instructions */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl flex flex-col gap-4">
            <h4 id="quick-instructions-heading" className="font-label-bold text-on-surface text-sm uppercase tracking-wide flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Swap Instructions
            </h4>
            <div className="text-xs text-on-surface-variant space-y-3 leading-relaxed">
              <p>
                This board acts as a companion logbook for manually recording in-hand swap sessions with other collectors at school, conventions, or meetups.
              </p>
              <div>
                <span className="font-bold block text-on-surface mb-0.5">Stickers You Gave</span>
                The stickers traded away will automatically decrement their counts in your virtual progress metrics by 1 copy.
              </div>
              <div>
                <span className="font-bold block text-on-surface mb-0.5">Stickers You Received</span>
                The stickers earned will automatically increment their progress in your album binder.
              </div>
              <div>
                <span className="font-bold block text-on-surface mb-0.5">Undo Support</span>
                Every logged manual swap session is logged below with real-time undo functionality to instantly restore your inventory numbers in case of human input error.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SEGMENT: SWAP HISTORY REGISTRY LOG */}
      <div id="swap-log-segment" className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Activity & Swap History ({activityLog.length})
          </h3>

          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Search history..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {filteredLog.length === 0 ? (
          <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-2xl p-12 text-center text-on-surface-variant">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-3">
              <ArrowLeftRight className="w-6 h-6 text-outline" />
            </div>
            <p className="font-label-bold text-sm text-on-surface">No entries found</p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
              Any direct swaps and manual adjustments you record will show up here.
            </p>
          </div>
        ) : (
          <div id="swap-history-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLog.map((entry) => (
              <div 
                id={`activity-item-${entry.id}`}
                key={entry.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Visual marker ribbon */}
                <div className={`absolute top-0 left-0 w-full h-1 ${entry.type === 'swap' ? 'bg-primary' : 'bg-amber-500'}`} />

                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-outline-variant/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        entry.type === 'swap' ? 'bg-primary-container text-on-primary-container' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {entry.type === 'swap' ? entry.personName.trim().substring(0, 1).toUpperCase() : '!'}
                      </div>
                      <div>
                        <p className="font-label-bold text-sm text-on-surface leading-none">
                          {entry.type === 'swap' ? entry.personName : 'Manual Adjustment'}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-1">
                          {entry.type === 'swap' ? 'Manual Exchange Partner' : 'Inventory Correction'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-outline font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>

                  {entry.type === 'swap' ? (
                    <>
                      {/* Stickers traded list grid */}
                      <div className="grid grid-cols-2 gap-4 my-2 text-xs">
                        {/* You Gave */}
                        <div id={`swap-gave-list-${entry.id}`}>
                          <p className="font-semibold text-[10px] uppercase tracking-wider text-amber-600 mb-1 font-black">You Gave:</p>
                          {entry.gaveStickers.length === 0 ? (
                            <p className="text-on-surface-variant italic text-[11px]">No stickers given</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {entry.gaveStickers.map(id => {
                                const s = stickersMap.get(id);
                                return (
                                  <span 
                                    id={`gave-tag-${entry.id}-${id}`}
                                    key={id} 
                                    title={s?.name}
                                    className="inline-flex items-center bg-amber-500/10 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                                  >
                                    {id}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* You Received */}
                        <div id={`swap-received-list-${entry.id}`}>
                          <p className="font-semibold text-[10px] uppercase tracking-wider text-secondary mb-1 font-black">You Received:</p>
                          {entry.receivedStickers.length === 0 ? (
                            <p className="text-on-surface-variant italic text-[11px]">No stickers received</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {entry.receivedStickers.map(id => {
                                const s = stickersMap.get(id);
                                return (
                                  <span 
                                    id={`received-tag-${entry.id}-${id}`}
                                    key={id} 
                                    title={s?.name}
                                    className="inline-flex items-center bg-secondary/15 text-secondary px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                                  >
                                    {id}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {entry.comment && (
                        <div className="col-span-2 mt-2 bg-surface-container-low p-2 rounded-lg border border-outline-variant/30 italic text-[10px] text-on-surface-variant">
                          "{entry.comment}"
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="my-2 bg-amber-50 p-3 rounded-xl border border-amber-200/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-amber-900 uppercase">Adjustment: {entry.stickerId}</span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${entry.delta > 0 ? 'bg-secondary text-white' : 'bg-amber-600 text-white'}`}>
                          {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 italic leading-relaxed">
                        "{entry.comment}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Direct Action buttons */}
                <div className="mt-4 pt-3.5 border-t border-outline-variant/60 flex justify-end">
                  <button
                    id={`undo-activity-btn-${entry.id}`}
                    type="button"
                    onClick={() => handleUndoSwap(entry)}
                    className="flex items-center gap-1.5 text-[11px] font-label-bold text-on-surface hover:text-[#ba1a1a] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-outline-variant"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Undo Entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
